from rest_framework import serializers
from apps.finance.models.department_budget import DepartmentBudget

class DepartmentBudgetSerializer(serializers.ModelSerializer):
    remaining_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = DepartmentBudget
        fields = [
            "id",
            "department",
            "allocated_amount",
            "used_amount",
            "remaining_amount"
        ]
