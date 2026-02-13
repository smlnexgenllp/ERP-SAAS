from rest_framework import serializers
from django.db import transaction
from django.db.models import F
from django.db.models.functions import Coalesce
from django.db.models.aggregates import Sum
from django.db.models import Q
from django.db.models.functions import Coalesce
from decimal import Decimal
from .models import (
    Item,
    PurchaseOrder, PurchaseOrderItem,
    GateEntry, GateEntryItem,
    GRN, GRNItem,
    QualityInspection, QualityInspectionItem,
    VendorInvoice,
    VendorPayment
)
from apps.finance.serializers.vendor import VendorSerializer
from apps.finance.models.vendor import Vendor


# ========================= ITEM =========================
class ItemSerializer(serializers.ModelSerializer):
    current_stock = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = [
            'id',
            'name',
            'code',
            'category',
            'uom',
            'vendors',           # ManyToMany → list of PKs
            'standard_price',
            'created_at',
            'current_stock',     # calculated
            'available_stock',   # calculated, never negative
        ]
        read_only_fields = [
            'id',
            'created_at',
            'current_stock',
            'available_stock',
        ]

    def get_current_stock(self, obj):
        """
        Current stock = SUM(IN + ADJ) - SUM(OUT)
        Uses a single efficient aggregation query
        """

        aggregates = obj.stock_movements.aggregate(
            total_in=Coalesce(
                Sum('quantity', filter=Q(transaction_type='IN')),
                Decimal('0.00')
            ),
            total_out=Coalesce(
                Sum('quantity', filter=Q(transaction_type='OUT')),
                Decimal('0.00')
            ),
            total_adj=Coalesce(
                Sum('quantity', filter=Q(transaction_type='ADJ')),
                Decimal('0.00')
            ),
        )

        return (
            aggregates['total_in']
            + aggregates['total_adj']
            - aggregates['total_out']
        )

    def get_available_stock(self, obj):
        """
        UI-friendly: never show negative stock
        """
        current_stock = self.get_current_stock(obj)
        return max(current_stock, Decimal('0.00'))
# ========================= PURCHASE ORDER =========================
class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    # For GET responses → show full item details
    item_details = ItemSerializer(source='item', read_only=True)
    
    # For writing (POST/PUT) → accept only the ID
    item = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(),
        required=True,
        write_only=True              # only used for input
    )
    
    # Optional: nice read-only alias for frontend
    rate = serializers.DecimalField(
        source='unit_price',
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    class Meta:
        model = PurchaseOrderItem
        fields = [
            'id',
            'item',           # write-only: ID
            'item_details',   # read-only: full object
            'ordered_qty',
            'unit_price',
            'rate',
            'total_price',
            'received_qty',
        ]
        read_only_fields = [
            'id',
            'total_price',
            'received_qty',
            'item_details',
            'rate',
        ]


class PurchaseOrderSerializer(serializers.ModelSerializer):
    # Nested items – now properly writable
    items = PurchaseOrderItemSerializer(many=True)
    
    # Same pattern for vendor
    vendor_details = VendorSerializer(source='vendor', read_only=True)
    vendor = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(),
        required=True,
        write_only=True
    )

    class Meta:
        model = PurchaseOrder
        fields = [
            'id',
            'organization',
            'department',
            'vendor',           # write: ID
            'vendor_details',   # read: full object
            'po_number',
            'status',
            'total_amount',
            'created_by',
            'created_at',
            'items',
        ]
        read_only_fields = [
            'id',
            'po_number',
            'total_amount',
            'created_at',
            'created_by',
            'organization',
            'status',           # if status is changed elsewhere
            'vendor_details',
        ]

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        
        # items is now already validated by the nested serializer
        items_data = validated_data.pop('items')
        
        # Set automatic fields
        validated_data['organization'] = request.user.organization
        validated_data['created_by'] = request.user
        
        # vendor is already a Vendor instance (from PrimaryKeyRelatedField)
        po = PurchaseOrder.objects.create(**validated_data)

        # Create items – item is already a Item instance
        for item_data in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                **item_data
            )

        po.update_total()
        return po


    # Optional: if you want to keep this method (for list/retrieve)
    def get_remaining_qty(self, obj):
        total_ordered = sum(item.ordered_qty for item in obj.items.all())
        
        total_received = sum(
            gei.delivered_qty 
            for ge in obj.gateentry_set.all() 
            for gei in ge.items.all()
        )
        
        return total_ordered - total_received   # ← probably what you want
# ========================= GATE ENTRY =========================
class GateEntryItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(),
        write_only=True
    )
    item_id = serializers.IntegerField(source='item.id', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = GateEntryItem
        fields = ['id', 'item', 'item_id', 'item_name', 'delivered_qty']


class GateEntrySerializer(serializers.ModelSerializer):
    items = GateEntryItemSerializer(many=True, required=True)
    po = serializers.PrimaryKeyRelatedField(queryset=PurchaseOrder.objects.all())
    po_details = serializers.SerializerMethodField()

    class Meta:
        model = GateEntry
        fields = [
            'id', 'po', 'po_details',
            'gate_entry_number',
            'dc_number',
            'vehicle_number',
            'challan_number',   # ✅ REQUIRED — ADD BACK
            'status', 'entry_time', 'organization', 'items'
        ]
        read_only_fields = (
            'organization', 'entry_time', 'gate_entry_number', 'status'
        )

    def get_po_details(self, obj):
        return {
            "id": obj.po.id,
            "po_number": obj.po.po_number,
            "vendor": {"id": obj.po.vendor.id, "name": obj.po.vendor.name},
            "total_amount": str(obj.po.total_amount),  # avoid Decimal issues
        }

    def validate(self, data):
        po = data.get("po")

        if po.status.lower() != "approved":
            raise serializers.ValidationError(
                {"po": "Purchase Order must be approved before creating Gate Entry"}
            )

        items_data = data.get("items", [])
        if not items_data:
            raise serializers.ValidationError({"items": "At least one item required."})

        po_items_map = {pi.item_id: pi for pi in po.items.all()}

        for idx, item_data in enumerate(items_data):
            item_obj = item_data.get("item")   # ← THIS IS OBJECT
            delivered_qty = item_data.get("delivered_qty")

            item_id = item_obj.id   # ✅ FIX

            if item_id not in po_items_map:
                raise serializers.ValidationError({
                    f"items[{idx}].item": f"Item ID {item_id} not in this PO."
                })

            po_item = po_items_map[item_id]
            remaining = po_item.ordered_qty - po_item.received_qty

            if delivered_qty <= 0:
                raise serializers.ValidationError({
                    f"items[{idx}].delivered_qty": "Must be positive number."
                })

            if delivered_qty > remaining:
                raise serializers.ValidationError({
                    f"items[{idx}].delivered_qty":
                        f"Cannot exceed remaining ({remaining})"
                })

        return data


    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        items_data = validated_data.pop("items")

        validated_data["organization"] = request.user.organization

        gate_entry = GateEntry.objects.create(**validated_data)

        for item_data in items_data:
            GateEntryItem.objects.create(
                gate_entry=gate_entry,
                item=item_data["item"],  # ✅ PASS OBJECT NOT ID
                delivered_qty=item_data["delivered_qty"]
            )

        return gate_entry


    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if items_data is not None:
            instance.items.all().delete()

            for item_data in items_data:
                GateEntryItem.objects.create(
                    gate_entry=instance,
                    item=item_data["item"],
                    delivered_qty=item_data["delivered_qty"]
                )

        return instance

    def to_internal_value(self, data):
        item_value = data.get('item')
        if item_value is not None:
            if not isinstance(item_value, (int, str)) or (isinstance(item_value, str) and not item_value.isdigit()):
                raise serializers.ValidationError({
                    'item': f"Expected integer ID, received: {type(item_value).__name__} → {item_value}"
                })
        return super().to_internal_value(data)    

# ========================= GRN =========================
# apps/inventory/serializers.py

class GRNItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GRNItem
        fields = ['item', 'received_qty']


class GRNSerializer(serializers.ModelSerializer):
    items = GRNItemSerializer(many=True)

    class Meta:
        model = GRN
        fields = "__all__"

        read_only_fields = [
            'organization',
            'po',
            'gate_entry',
            'grn_number',
            'status',
            'received_date'
        ]

    def validate(self, data):
        qc = data.get('quality_inspection')

        if not qc:
            raise serializers.ValidationError(
                "Quality Inspection is required to create GRN"
            )

        if not qc.is_approved:
            raise serializers.ValidationError(
                "GRN can be created only from APPROVED Quality Inspection"
            )

        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']

        qc = validated_data.pop('quality_inspection')
        items_data = validated_data.pop('items', [])

        # Take PO and Gate Entry from QC automatically
        gate = qc.gate_entry

        grn = GRN.objects.create(
            organization=request.user.organization,
            po=gate.po,
            gate_entry=gate,
            quality_inspection=qc,
            status='pending_approval',
            **validated_data
        )

        created_count = 0

        for item_data in items_data:
            if item_data.get('received_qty', 0) > 0:
                GRNItem.objects.create(
                    grn=grn,
                    **item_data
                )
                created_count += 1

        if created_count == 0:
            raise serializers.ValidationError(
                "No valid items to create GRN"
            )

        gate.status = 'grn_created'
        gate.save(update_fields=['status'])

        return grn        
# ========================= QUALITY INSPECTION =========================
class QualityInspectionItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(),
        write_only=True
    )
    item_id   = serializers.IntegerField(source='item.id', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_code = serializers.CharField(source='item.code', read_only=True)

    class Meta:
        model = QualityInspectionItem
        fields = [
            'item', 'item_id', 'item_name', 'item_code',
            'accepted_qty', 'rejected_qty',
        ]



class QualityInspectionSerializer(serializers.ModelSerializer):
    items = QualityInspectionItemSerializer(many=True, required=True)

    class Meta:
        model = QualityInspection
        fields = [
            'id',
            'gate_entry',
            'inspected_by',
            'remarks',
            'inspection_date',
            'is_approved',
            'items'
        ]
        read_only_fields = ['inspection_date', 'inspected_by', 'is_approved']


    def validate_gate_entry(self, value):
        if not value:
            raise serializers.ValidationError("Gate entry is required.")

        request = self.context['request']
        if value.organization != request.user.organization:
            raise serializers.ValidationError(
                "Gate entry belongs to a different organization."
            )
        return value


    def validate(self, data):
        gate = data['gate_entry']

        if gate.status not in ('pending_qc', 'qc_in_progress'):
            raise serializers.ValidationError(
                f"Cannot start QC — current status is '{gate.status}'. "
                f"Allowed statuses: pending_qc, qc_in_progress"
            )

        items_data = data.get('items', [])
        if not items_data:
            raise serializers.ValidationError({
                "items": "At least one item is required for inspection."
            })

        gate_items = {
            gi.item_id: gi.delivered_qty
            for gi in gate.items.all()
        }

        if not gate_items:
            raise serializers.ValidationError(
                "Gate entry has no items to inspect."
            )

        for idx, item_data in enumerate(items_data):
            item = item_data.get('item')  # 🔥 Already Item instance
            delivered = gate_items.get(item.id)

            if delivered is None:
                raise serializers.ValidationError(
                    f"Item {item.id} not found in gate entry items."
                )

            accepted = item_data.get('accepted_qty', 0)
            rejected = item_data.get('rejected_qty', 0)

            if accepted < 0 or rejected < 0:
                raise serializers.ValidationError(
                    f"Quantities cannot be negative for item {item.id}."
                )

            if abs(accepted + rejected - delivered) > 0.01:
                raise serializers.ValidationError(
                    f"Accepted ({accepted}) + Rejected ({rejected}) "
                    f"must equal delivered ({delivered}) for item {item.id}."
                )

        return data


    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        items_data = validated_data.pop('items')

        validated_data['inspected_by'] = request.user
        inspection = QualityInspection.objects.create(**validated_data)

        for item_data in items_data:
            QualityInspectionItem.objects.create(
                quality_inspection=inspection,
                **item_data
            )

        gate = inspection.gate_entry

        total_delivered = gate.items.aggregate(
            total=Sum('delivered_qty')
        )['total'] or 0

        total_accepted = inspection.items.aggregate(
            total=Sum('accepted_qty')
        )['total'] or 0

        if total_accepted >= total_delivered * Decimal('0.95'):
            gate.status = 'qc_passed'
            inspection.is_approved = True
        elif total_accepted == 0:
            gate.status = 'qc_rejected'
        else:
            gate.status = 'qc_in_progress'

        gate.save(update_fields=['status'])
        inspection.save(update_fields=['is_approved'])

        return inspection


# ========================= VENDOR INVOICE =========================
class VendorInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorInvoice
        fields = "__all__"
        read_only_fields = ("organization", "total_amount")

    def validate(self, data):
        grn = data["grn"]
        if grn.status != "approved":
            raise serializers.ValidationError("GRN must be approved before creating Invoice")
        
        # Calculate expected total
        po = grn.po
        calculated_total = 0
        for grn_item in grn.items.all():
            po_item = PurchaseOrderItem.objects.get(purchase_order=po, item=grn_item.item)
            calculated_total += grn_item.received_qty * po_item.unit_price
        
        data["total_amount"] = calculated_total
        return data

    def create(self, validated_data):
        validated_data["organization"] = self.context["request"].user.organization
        return super().create(validated_data)

# ========================= VENDOR PAYMENT =========================
class VendorPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorPayment
        fields = "__all__"
        read_only_fields = ("payment_date",)

    def validate(self, data):
        invoice = data["invoice"]
        previous_payments = VendorPayment.objects.filter(invoice=invoice).aggregate(
            paid=Coalesce(Sum("amount"), 0)
        )["paid"]
        remaining = invoice.total_amount - previous_payments
        if data["amount"] > remaining:
            raise serializers.ValidationError(f"Payment cannot exceed remaining {remaining}")
        return data

    def create(self, validated_data):
        return super().create(validated_data)