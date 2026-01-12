# apps/accounts/serializers/coa.py
from rest_framework import serializers
from apps.finance.models.chart_of_accounts import ChartOfAccount

class ChartOfAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChartOfAccount
        fields = "__all__"
