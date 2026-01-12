from rest_framework import serializers
from apps.finance.models.budget import MonthlyBudget

class MonthlyBudgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonthlyBudget
        fields = "__all__"
        read_only_fields = (
            "organization",
            "released",
            "created_by",
            "released_by",
        )


