from rest_framework import serializers
from apps.finance.models.gst_reconciliation import GSTReconciliation
class GSTReconciliationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSTReconciliation
        fields = '__all__'