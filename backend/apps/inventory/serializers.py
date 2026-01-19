from rest_framework import serializers
from django.db import transaction
from django.db.models import F
from django.db.models.functions import Coalesce
from django.db.models.aggregates import Sum
from .models import (
    Item,
    PurchaseOrder, PurchaseOrderItem,
    GateEntry, GateEntryItem,
    GRN, GRNItem,
    QualityInspection, QualityInspectionItem,
    VendorInvoice,
    VendorPayment
)

# ========================= ITEM =========================
class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = "__all__"

# ========================= PURCHASE ORDER =========================
class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseOrderItem
        exclude = ("purchase_order",)

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True)

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
    class Meta:
        model = GateEntryItem
        exclude = ("gate_entry",)

class GateEntrySerializer(serializers.ModelSerializer):
    items = GateEntryItemSerializer(many=True)
    po = serializers.PrimaryKeyRelatedField(queryset=PurchaseOrder.objects.all())
    po_details = serializers.SerializerMethodField()

    class Meta:
        model = GateEntry
        fields = "__all__"
        read_only_fields = ("organization", "entry_time", "gate_entry_number", "status")

    def get_po_details(self, obj):
        return {
            "id": obj.po.id,
            "po_number": obj.po.po_number,
            "vendor": {"id": obj.po.vendor.id, "name": obj.po.vendor.name},
            "total_amount": obj.po.total_amount,
        }

    def validate(self, data):
        po = data["po"]
        if po.status != "approved":
            raise serializers.ValidationError("PO must be approved to create Gate Entry")
        items_data = self.initial_data.get("items", [])
        for item_data in items_data:
            item = Item.objects.get(id=item_data["item"])
            po_item = PurchaseOrderItem.objects.filter(purchase_order=po, item=item).first()
            if not po_item:
                raise serializers.ValidationError(f"Item {item.name} not in PO")
            remaining = po_item.ordered_qty - po_item.received_qty
            if item_data["delivered_qty"] > remaining:
                raise serializers.ValidationError(f"Delivered qty for {item.name} exceeds remaining {remaining}")
        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        items_data = validated_data.pop("items")
        validated_data["organization"] = request.user.organization
        gate_entry = GateEntry.objects.create(**validated_data)
        for item in items_data:
            GateEntryItem.objects.create(gate_entry=gate_entry, **item)
        return gate_entry

# ========================= GRN =========================
# apps/inventory/serializers.py

class GRNItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = GRNItem
        fields = ['item', 'received_qty']  # only what client might send (optional)


class GRNSerializer(serializers.ModelSerializer):
    items = GRNItemSerializer(many=True, read_only=True)  # only for response

    class Meta:
        model = GRN
        fields = "__all__"
        read_only_fields = (
            "organization",
            "grn_number",
            "status",
            "received_date",
            "items",  # ← read-only
        )

    def validate(self, data):
        gate_entry = data.get('gate_entry')
        if not gate_entry:
            raise serializers.ValidationError("gate_entry is required")
        
        if gate_entry.status != 'approved':
            raise serializers.ValidationError("Gate Entry must be approved before creating GRN")
        
        # Optional: check if GRN already exists for this gate_entry
        if GRN.objects.filter(gate_entry=gate_entry).exists():
            raise serializers.ValidationError("GRN already exists for this Gate Entry")
        
        return data

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]

        # === Critical: Set organization from user ===
        validated_data["organization"] = request.user.organization
        validated_data["status"] = "pending"

        # Get the related GateEntry
        gate_entry = validated_data["gate_entry"]

        # Create GRN without items first
        grn = GRN.objects.create(**validated_data)

        # Automatically copy items from GateEntry (with received_qty = delivered_qty)
        for ge_item in gate_entry.items.all():
            GRNItem.objects.create(
                grn=grn,
                item=ge_item.item,
                received_qty=ge_item.delivered_qty  # copy delivered as received
            )

        return grn
# ========================= QUALITY INSPECTION =========================
class QualityInspectionItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QualityInspectionItem
        exclude = ("quality_inspection",)

from django.db import transaction
from rest_framework import serializers

class QualityInspectionSerializer(serializers.ModelSerializer):
    items = QualityInspectionItemSerializer(many=True)

    class Meta:
        model = QualityInspection
        fields = "__all__"

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")

        # ✅ USE EXISTING GRN
        inspection = QualityInspection.objects.create(**validated_data)

        for item in items_data:
            QualityInspectionItem.objects.create(
                quality_inspection=inspection,
                **item
            )

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