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
    item = ItemSerializer(read_only=True)
    rate = serializers.DecimalField(
        source='unit_price',           # or 'standard_price' – use your actual model field
        max_digits=12,
        decimal_places=2,
        read_only=True
    )
    class Meta:
        model = PurchaseOrderItem
        exclude = ("purchase_order",)

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)
    vendor     = VendorSerializer(read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = "__all__"
        read_only_fields = (
            "total_amount",
            "created_at",
            "po_number",
            "organization",
            "created_by",
        )

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        items_data = validated_data.pop("items")

        validated_data["organization"] = request.user.organization
        validated_data["created_by"] = request.user

        po = PurchaseOrder.objects.create(**validated_data)

        for item in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                **item
            )

        po.update_total()
        return po
    def get_remaining_qty(self, obj):
        # Total ordered
        total_ordered = sum(item.ordered_qty for item in obj.items.all())
        
        # Total received from all gate entries
        total_received = sum(
            gei.delivered_qty for ge in obj.gateentry_set.all() 
            for gei in ge.items.all()
        )

# ========================= GATE ENTRY =========================
class GateEntryItemSerializer(serializers.ModelSerializer):
    # Make item writable
    item = serializers.PrimaryKeyRelatedField(
        queryset=Item.objects.all(),
        write_only=True
    )

    # Keep these for response / display
    item_id = serializers.IntegerField(source='item.id', read_only=True)
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = GateEntryItem
        fields = [
            'id',
            'item',          # ← client sends this (id)
            'item_id',       # ← returned in GET
            'item_name',
            'delivered_qty',
        ]


class GateEntrySerializer(serializers.ModelSerializer):
    items = GateEntryItemSerializer(many=True, required=True)
    po = serializers.PrimaryKeyRelatedField(queryset=PurchaseOrder.objects.all())
    po_details = serializers.SerializerMethodField()

    class Meta:
        model = GateEntry
        fields = [
            'id',
            'po',
            'po_details',
            'gate_entry_number',
            'dc_number',
            'vehicle_number',
            'challan_number',
            'status',
            'entry_time',
            'organization',
            'items',
        ]
        read_only_fields = (
            'organization',
            'entry_time',
            'gate_entry_number',
            'status',           # ← very important now: controlled by backend
        )

    def get_po_details(self, obj):
        return {
            "id": obj.po.id,
            "po_number": obj.po.po_number,
            "vendor": {
                "id": obj.po.vendor.id,
                "name": obj.po.vendor.name
            },
            "total_amount": obj.po.total_amount,
        }

    def validate(self, data):
        po = data.get("po")
        if not po:
            raise serializers.ValidationError({"po": "This field is required."})

        if po.status != "approved":
            raise serializers.ValidationError(
                {"po": "Purchase Order must be approved before creating Gate Entry"}
            )

        # Validate items
        items_data = self.initial_data.get("items", [])
        if not items_data:
            raise serializers.ValidationError({"items": "At least one item is required."})

        po_items_map = {
            pi.item_id: pi for pi in po.items.all()
        }

        for item_data in items_data:
            item_id = item_data.get("item")
            delivered_qty = item_data.get("delivered_qty")

            if not item_id:
                raise serializers.ValidationError("Each item must have an 'item' field.")

            if item_id not in po_items_map:
                try:
                    item = Item.objects.get(id=item_id)
                    raise serializers.ValidationError(
                        f"Item '{item.name}' (id: {item_id}) is not part of this Purchase Order."
                    )
                except Item.DoesNotExist:
                    raise serializers.ValidationError(f"Invalid item id: {item_id}")

            po_item = po_items_map[item_id]
            remaining = po_item.ordered_qty - po_item.received_qty

            if delivered_qty is None or delivered_qty < 0:
                raise serializers.ValidationError(
                    f"Delivered quantity for item {item_id} must be a positive number."
                )

            if delivered_qty > remaining:
                raise serializers.ValidationError(
                    f"Delivered qty ({delivered_qty}) for item {po_item.item.name} "
                    f"exceeds remaining quantity ({remaining})"
                )

        # Prevent client from setting status manually on creation
        if self.instance is None and "status" in data:
            raise serializers.ValidationError(
                {"status": "Status cannot be set manually on creation."}
            )

        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        items_data = validated_data.pop("items")

        # Force organization from authenticated user
        validated_data["organization"] = request.user.organization

        # Status is always set to pending_qc on creation
        validated_data["status"] = "pending_qc"

        gate_entry = GateEntry.objects.create(**validated_data)

        for item_data in items_data:
            GateEntryItem.objects.create(
                gate_entry=gate_entry,
                **item_data
            )

        return gate_entry

    @transaction.atomic
    def update(self, instance, validated_data):
        # For updates, allow only certain fields if needed
        # But typically Gate Entry should not be updated after creation
        # → you may want to block update completely or restrict heavily

        items_data = validated_data.pop("items", None)

        # Update basic fields (if allowed)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()

        if items_data is not None:
            # Optional: allow updating items (but usually not recommended)
            # Clear old items and recreate (or implement diff logic)
            instance.items.all().delete()
            for item_data in items_data:
                GateEntryItem.objects.create(
                    gate_entry=instance,
                    **item_data
                )

        return instance

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