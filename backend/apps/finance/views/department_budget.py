from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from apps.organizations.models import OrganizationUser
from apps.finance.models.department_budget import DepartmentBudget
from apps.finance.serializers.department_budget import DepartmentBudgetSerializer


class DepartmentBudgetViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentBudgetSerializer
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
        return DepartmentBudget.objects.filter(
            monthly_budget__organization=org
        )

    def perform_create(self, serializer):
        org_user = self.get_organization_user()

        # Optional: restrict only Accounts role
        if org_user.role not in ["ACCOUNTS", "MD"]:
            raise PermissionDenied("Only Accounts can allocate budgets")

        serializer.save(created_by=self.request.user)
