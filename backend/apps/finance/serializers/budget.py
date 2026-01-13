# apps/finance/serializers.py

from rest_framework import serializers
from apps.finance.models.budget import MonthlyBudget
from apps.finance.models.department_budget import DepartmentBudget 


class MonthlyBudgetSerializer(serializers.ModelSerializer):
    """
    Main serializer for monthly budget list
    """
    department_allocations = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = MonthlyBudget
        fields = [
            'id',
            'month',                    # adjust according to your actual field names
            'amount',
            'released',
            # 'created_at',
            'department_allocations',   # ← this is the important new field
            # add any other fields you already have
        ]

    def get_department_allocations(self, obj):
        """
        Returns dictionary of current allocations per department
        Format: {"HR": "1200000.00", "SALES": "2500000.00", ...}
        """
        return {
            db.department: str(db.allocated_amount)
            for db in obj.department_budgets.all()
        }