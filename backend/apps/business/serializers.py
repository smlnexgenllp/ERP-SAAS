from rest_framework import serializers
from .models import DashboardPreference


class DashboardPreferenceSerializer(serializers.ModelSerializer):

    class Meta:
        model = DashboardPreference
        fields = "__all__"


class DashboardSummarySerializer(serializers.Serializer):

    total_sales_orders = serializers.IntegerField()

    total_customers = serializers.IntegerField()

    total_products = serializers.IntegerField()

    total_sales_amount = serializers.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    inventory_items = serializers.IntegerField()

    low_stock_items = serializers.IntegerField()

    opportunities = serializers.IntegerField()

    quotations = serializers.IntegerField()