# apps/stock/serializers.py
from rest_framework import serializers
from decimal import Decimal
from apps.inventory.models import Item, StockLedger   # ← import from inventory app
from django.db.models import Sum

class StockLedgerSerializer(serializers.ModelSerializer):
    item_code = serializers.CharField(source='item.code', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    uom       = serializers.CharField(source='item.uom', read_only=True)
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True,
        default='System'
    )

    class Meta:
        model = StockLedger
        fields = [
            'id',
            'item', 'item_code', 'item_name', 'uom',
            'quantity', 'transaction_type',
            'reference', 'created_at', 'created_by', 'created_by_name',
        ]
        read_only_fields = fields


class ItemStockSerializer(serializers.ModelSerializer):
    current_stock    = serializers.SerializerMethodField()
    available_stock  = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'category', 'uom',
            'standard_price', 'created_at',
            'current_stock', 'available_stock',
        ]
        read_only_fields = [
            'id', 'code', 'created_at',
            'current_stock', 'available_stock'
        ]

    def get_current_stock(self, obj: Item) -> Decimal:
        in_sum = obj.stock_movements.filter(transaction_type='IN')\
                                   .aggregate(s=Sum('quantity'))['s'] or Decimal('0.00')
        out_sum = obj.stock_movements.filter(transaction_type='OUT')\
                                    .aggregate(s=Sum('quantity'))['s'] or Decimal('0.00')
        adj_sum = obj.stock_movements.filter(transaction_type='ADJ')\
                                    .aggregate(s=Sum('quantity'))['s'] or Decimal('0.00')

        return in_sum + adj_sum - out_sum

    def get_available_stock(self, obj: Item) -> Decimal:
        return max(self.get_current_stock(obj), Decimal('0.00'))