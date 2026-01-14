from rest_framework import serializers
from .models import Item, Vendor

class ItemSerializer(serializers.ModelSerializer):
    vendors = serializers.PrimaryKeyRelatedField(queryset=Vendor.objects.all(), many=True, required=False)

    class Meta:
        model = Item
        fields = ['id', 'name', 'code', 'category', 'uom', 'vendors', 'standard_price', 'created_at']
from rest_framework import serializers
from .models import PurchaseOrder, PurchaseOrderItem


class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        fields = ['item', 'quantity', 'unit_price', 'total_price']

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)

    class Meta:
        model = PurchaseOrder
        fields = ['organization', 'department', 'vendor', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        organization = validated_data.pop('organization')
        po = PurchaseOrder.objects.create(organization=organization, **validated_data)

        for item in items_data:
            PurchaseOrderItem.objects.create(purchase_order=po, **item)

        return po

