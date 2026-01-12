from rest_framework import serializers
from apps.finance.models.department_budget import DepartmentBudget

class DepartmentBudgetSerializer(serializers.ModelSerializer):
    remaining_amount = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = DepartmentBudget
        fields = [
            "id",
            "monthly_budget",
            "department",
            "allocated_amount",
            "used_amount",
            "remaining_amount",
        ]
        read_only_fields = ("used_amount",)
