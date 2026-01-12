from rest_framework.decorators import action
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied

from apps.organizations.models import OrganizationUser
from apps.finance.models.budget import MonthlyBudget
from apps.finance.serializers.budget import MonthlyBudgetSerializer


class MonthlyBudgetViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlyBudgetSerializer
    permission_classes = [IsAuthenticated]

    # =============================
    # INTERNAL HELPERS
    # =============================
    def get_organization_user(self):
        """
        Return OrganizationUser or deny access
        """
        org_user = OrganizationUser.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related("organization").first()

        if not org_user:
            raise PermissionDenied("User is not linked to any organization.")

        return org_user

    def get_organization(self):
        """
        Return Organization linked to logged-in user
        """
        return self.get_organization_user().organization

    # =============================
    # QUERYSET
    # =============================
    def get_queryset(self):
        organization = self.get_organization()
        return MonthlyBudget.objects.filter(organization=organization)

    # =============================
    # CREATE
    # =============================
    def perform_create(self, serializer):
        organization = self.get_organization()
        serializer.save(
            organization=organization,
            created_by=self.request.user
        )

    # =============================
    # RELEASE ACTION
    # =============================
    @action(detail=True, methods=["post"])
    def release(self, request, pk=None):
        budget = self.get_object()

        if budget.released:
            return Response(
                {"detail": "Budget already released."},
                status=400
            )

        budget.released = True
        budget.released_by = request.user
        budget.save(update_fields=["released", "released_by"])

        return Response(
            {"status": "Budget released successfully"}
        )

from apps.finance.models.department_budget import DepartmentBudget
from apps.finance.serializers.department_budget import DepartmentBudgetSerializer

@action(detail=True, methods=["post"])
def allocate(self, request, pk=None):
    """
    Allocate released budget department-wise
    """
    budget = self.get_object()

    if not budget.released:
        return Response(
            {"detail": "Budget must be released before allocation"},
            status=400
        )

    allocation = request.data.get("allocation", {})
    if not allocation:
        return Response(
            {"detail": "Allocation data required"},
            status=400
        )

    total_allocated = sum(float(v) for v in allocation.values())
    if total_allocated > float(budget.amount):
        return Response(
            {"detail": "Allocated amount exceeds released budget"},
            status=400
        )

    org = self.get_organization()

    created = []
    for dept, amount in allocation.items():
        obj, _ = DepartmentBudget.objects.update_or_create(
            organization=org,
            monthly_budget=budget,
            department=dept.upper(),
            defaults={
                "allocated_amount": amount,
                "allocated_by": request.user
            }
        )
        created.append(obj)

    serializer = DepartmentBudgetSerializer(created, many=True)
    return Response(serializer.data, status=201)
