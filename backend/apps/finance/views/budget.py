from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from apps.organizations.models import OrganizationUser
from apps.finance.models.budget import MonthlyBudget
from apps.finance.models.department_budget import DepartmentBudget
from apps.finance.serializers.budget import MonthlyBudgetSerializer
from apps.finance.serializers.department_budget import DepartmentBudgetSerializer
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction

class MonthlyBudgetViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlyBudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_organization_user(self):
        org_user = OrganizationUser.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related("organization").first()

        if not org_user:
            raise PermissionDenied("User not linked to organization")

        return org_user

    def get_queryset(self):
        org = self.get_organization_user().organization
        return MonthlyBudget.objects.filter(organization=org)

    def perform_create(self, serializer):
        serializer.save(
            organization=self.get_organization_user().organization,
            created_by=self.request.user
        )

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def allocate(self, request, pk=None):
        monthly_budget = self.get_object()
        allocation_data = request.data.get('allocation', {})

        if not allocation_data:
            return Response(
                {"detail": "No allocation data provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        updated_count = 0
        errors = []

        print("Received allocation payload:", allocation_data)  # ← debug line (remove later)

        for department, amount_str in allocation_data.items():
            try:
                amount = Decimal(str(amount_str).strip() or '0')
                if amount < 0:
                    raise ValueError("Amount cannot be negative")

                # Make sure department name matches exactly your choices
                department = department.strip().upper()

                # Optional: validate department exists in choices
                valid_depts = dict(DepartmentBudget.DEPARTMENT_CHOICES).keys()
                if department not in valid_depts:
                    raise ValueError(f"Invalid department: {department}")

                # This is the key line - update/create for EACH department
                dept_budget, created = DepartmentBudget.objects.update_or_create(
                    monthly_budget=monthly_budget,
                    department=department,
                    defaults={
                        'allocated_amount': amount,
                        'created_by': request.user if hasattr(request, 'user') and request.user.is_authenticated else None,
                    }
                )

                updated_count += 1

            except (InvalidOperation, ValueError) as e:
                errors.append(f"{department}: {str(e)}")
            except Exception as e:
                errors.append(f"{department}: Unexpected error - {str(e)}")

        if errors:
            return Response(
                {
                    "detail": f"Processed with {updated_count} success(es), but {len(errors)} error(s)",
                    "errors": errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response({
            "status": "success",
            "message": f"Successfully allocated/updated {updated_count} department(s)",
            "total_processed": updated_count
        }, status=status.HTTP_200_OK)
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def close_month(self, request, pk=None):
        """
        Lock the budget for the month so no further allocations are allowed.
        """
        budget = self.get_object()

        if budget.is_closed:
            return Response(
                {"detail": "Month already closed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        budget.is_closed = True
        budget.save()

        return Response(
            {"status": "success", "message": "Month closed and budget locked."},
            status=status.HTTP_200_OK
        )
    @action(detail=True, methods=["post"])
    @transaction.atomic
    def release(self, request, pk=None):
        monthly_budget = self.get_object()

        if monthly_budget.released:
            return Response(
                {"detail": "Budget already released"},
                status=status.HTTP_400_BAD_REQUEST
            )

        monthly_budget.released = True
        monthly_budget.save(update_fields=["released"])

        return Response(
            {
                "status": "success",
                "message": "Monthly budget released successfully"
            },
            status=status.HTTP_200_OK
        )

class DepartmentAllocationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        budget = get_object_or_404(MonthlyBudget, pk=pk)

        allocations = {
            db.department: str(db.allocated_amount)
            for db in budget.department_budgets.all()
        }

        return Response({
            "budget_id": budget.id,
            "is_closed": budget.is_closed,
            "allocations": allocations
        })
    