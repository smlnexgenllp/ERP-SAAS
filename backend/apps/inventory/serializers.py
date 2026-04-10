from rest_framework import serializers
from django.db import transaction
from django.db.models import F
from django.db.models.functions import Coalesce
from django.db.models.aggregates import Sum
from django.db import models
from django.db.models import Q
from django.db.models.functions import Coalesce
from decimal import Decimal
from .models import (
    Item,
    ItemDependency,
    PurchaseOrder, PurchaseOrderItem,
    GateEntry, GateEntryItem,
    GRN, GRNItem,
    QualityInspection, QualityInspectionItem,
    VendorInvoice,
    VendorPayment,Machine
)
from apps.finance.serializers.vendor import VendorSerializer
from apps.finance.models.vendor import Vendor
from apps.hr.models import Department


# ========================= ITEM =========================
class ItemDependencySerializer(serializers.ModelSerializer):
    child_item_name = serializers.CharField(source='child_item.name', read_only=True)
    child_item_code = serializers.CharField(source='child_item.code', read_only=True)
    child_item_uom  = serializers.CharField(source='child_item.uom',  read_only=True, default=None)

    class Meta:
        model = ItemDependency
        fields = [
            'id',
            'child_item',          # ID of the child
            'child_item_name',
            'child_item_code',
            'child_item_uom',
            'quantity',
        ]
        read_only_fields = ['id']


class ItemSerializer(serializers.ModelSerializer):
    current_stock   = serializers.SerializerMethodField()
    available_stock = serializers.SerializerMethodField()

    # For writing (create/update) - simple input format
    components_write = serializers.ListSerializer(
        child=serializers.DictField(),
        required=False,
        write_only=True,
        allow_empty=True,
        source='components'   # maps to the related_name
    )

    # For reading (list & detail) - nice detailed output
    bom_components = ItemDependencySerializer(
        source='components',
        many=True,
        read_only=True
    )

    class Meta:
        model = Item
        fields = [
            'id',
            'name',
            'code',
            'category',
            'item_type',
            'uom',
            'vendors',
            'standard_price',
            'organization',
            'created_at',
            'current_stock',
            'available_stock',
            'bom_components',         # ← now visible in GET
            'components_write',       # only used when POST/PUT
        ]
        read_only_fields = [
            'id',
            'created_at',
            'current_stock',
            'available_stock',
            'organization',
            'bom_components',
        ]

    def create(self, validated_data):
        request = self.context["request"]
        
        # Pop components before creating main item
        components_data = validated_data.pop('components', [])
        
        # Set organization automatically
        validated_data["organization"] = request.user.organization
        
        # Create the parent item
        item = super().create(validated_data)
        
        # Create BOM (Bill of Materials) entries
        self._create_components(item, components_data)
        
        return item

    def update(self, instance, validated_data):
        components_data = validated_data.pop('components', None)
        
        # Update main fields
        instance = super().update(instance, validated_data)
        
        # If components were sent → replace existing ones
        if components_data is not None:
            # Clear old dependencies
            instance.components.all().delete()
            # Create new ones
            self._create_components(instance, components_data)
        
        return instance

    def _create_components(self, parent_item, components_data):
        """Helper to create ItemDependency records"""
        for comp in components_data:
            child_id = comp.get('child_item')
            quantity = comp.get('quantity')
            
            if not child_id or not quantity:
                continue  # or raise error - your choice
                
            try:
                child_item = Item.objects.get(
                    id=child_id,
                    organization=parent_item.organization
                )
                
                ItemDependency.objects.create(
                    parent_item=parent_item,
                    child_item=child_item,
                    quantity=quantity
                )
            except Item.DoesNotExist:
                raise serializers.ValidationError(
                    f"Component item with ID {child_id} not found or belongs to different organization."
                )
            except Exception as e:
                raise serializers.ValidationError(f"Error adding component: {str(e)}")
            

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
    def validate(self, data):
        # Optional: extra business rules
        category = data.get('category')
        item_type = data.get('item_type')
        
        if item_type == 'production' and category == 'raw':
            raise serializers.ValidationError({
                "item_type": "Raw materials should not be marked as production items."
            })
            
        return data
    


# # Then in ItemSerializer:
# class ItemSerializer(serializers.ModelSerializer):
#     # ...
#     components = ItemDependencySerializer(
#         source='components',   # related_name='components'
#         many=True,
#         read_only=True
#     )
    
  
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
    # Nested Items
    items = PurchaseOrderItemSerializer(many=True, read_only=True)

    # Vendor - For Writing (ID) and Reading (Full Details)
    vendor = serializers.PrimaryKeyRelatedField(
        queryset=Vendor.objects.all(),
        required=True,
        write_only=True
    )
    vendor_details = VendorSerializer(source='vendor', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)   # ← Added for easy display

    # Department - Since it's currently CharField, we add a display name
    # If you later change department to ForeignKey, this will still work
    department_name = serializers.SerializerMethodField()                     # ← Added

    class Meta:
        model = PurchaseOrder
        fields = [
            'id',
            'po_number',
            'status',
            'department',          # Keep original if needed
            'department_name',     # ← New: Human readable name
            'vendor',
            'vendor_name',         # ← New: Easy access to name
            'vendor_details',      # Full vendor object (optional)
            'tax_percentage',
            'subtotal',
            'tax_amount',
            'total_amount',
            'created_by',
            'created_at',
            'items',
        ]
        read_only_fields = [
            'id', 
            'po_number', 
            'status', 
            'created_at', 
            'created_by',
            'subtotal', 
            'tax_amount', 
            'total_amount',
            'vendor_name',
            'department_name',
            'vendor_details',
        ]

    # Method to get department name safely
    def get_department_name(self, obj):
        if hasattr(obj.department, 'name'):        # If it's a ForeignKey object
            return obj.department.name
        return obj.department or "—"               # If it's still a string/CharField

    @transaction.atomic
    def create(self, validated_data):
        request = self.context["request"]
        items_data = validated_data.pop('items')

        validated_data['organization'] = request.user.organization
        validated_data['created_by'] = request.user

        po = PurchaseOrder.objects.create(**validated_data)

        for item_data in items_data:
            PurchaseOrderItem.objects.create(
                purchase_order=po,
                **item_data
            )

        po.update_totals()
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


# apps/inventory/serializers.py
from rest_framework import serializers
from django.db.models import Sum, F
from .models import GRN

class GRNSerializer(serializers.ModelSerializer):
    po_number = serializers.CharField(source='po.po_number', read_only=True)
    vendor_name = serializers.CharField(source='po.vendor.name', read_only=True)
    total_value = serializers.SerializerMethodField()

    class Meta:
        model = GRN
        fields = [
            'id',
            'grn_number',
            'received_date',
            'po_number',
            'vendor_name',
            'total_value'
        ]

    def get_total_value(self, obj):
        """Calculate total value from GRN items linked to PO items"""
        total = obj.items.aggregate(
            total_value=Sum(
                F('received_qty') * F('grn__po__items__unit_price'),
                output_field=models.DecimalField()
            )
        )['total_value']
        return float(total or 0)

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
        read_only_fields = ['inspection_date']


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
# serializers.py
from rest_framework import serializers
from .models import VendorInvoice, VendorPayment


# apps/inventory/serializers.py

class VendorInvoiceSerializer(serializers.ModelSerializer):
    grn_number = serializers.CharField(source='grn.grn_number', read_only=True)
    po_number = serializers.CharField(source='grn.po.po_number', read_only=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True)
    paid_amount = serializers.SerializerMethodField()

    class Meta:
        model = VendorInvoice
        fields = [
            'id', 
            'invoice_number', 
            'invoice_date', 
            'total_amount',
            'grn', 
            'grn_number', 
            'po_number', 
            'vendor', 
            'vendor_name',
            'paid_amount',
        ]
        read_only_fields = ['organization']

    def get_paid_amount(self, obj):
        """Calculate total paid amount using correct related_name"""
        total = obj.payments.aggregate(total=Sum('amount'))['total']   # ← Changed here
        return total or Decimal('0.00')
# serializers.py
class VendorInvoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VendorInvoice
        fields = ['invoice_number', 'invoice_date', 'total_amount']

    def create(self, validated_data):
        # This is already handled in the view, but extra safety
        return super().create(validated_data)


class VendorPaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    vendor_name = serializers.CharField(source='invoice.vendor.name', read_only=True)

    class Meta:
        model = VendorPayment
        fields = [
            'id', 
            'invoice', 
            'invoice_number', 
            'vendor_name',
            'amount', 
            'payment_mode', 
            'reference_number',
            'payment_date'
        ]
        read_only_fields = ['payment_date']

from rest_framework import serializers
from .models import Machine
from apps.hr.models import Department

class MachineSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    work_center_type_display = serializers.CharField(source='get_work_center_type_display', read_only=True)
    maintenance_status_display = serializers.CharField(source='get_maintenance_status_display', read_only=True)
    effective_capacity = serializers.SerializerMethodField()
    
    # Make sure these fields are properly handled
    description = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    last_maintenance_date = serializers.DateField(required=False, allow_null=True)
    next_maintenance_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Machine
        fields = [
            'id', 'name', 'code', 'department', 'department_name',
            'work_center_type', 'work_center_type_display',
            'maintenance_status', 'maintenance_status_display',
            'is_active',
            'capacity_per_day_hours',
            'efficiency_percentage',
            'utilization_percentage',
            'default_queue_time_hours',
            'setup_time_hours',
            'hourly_labor_cost',
            'hourly_overhead_cost',
            'last_maintenance_date',
            'next_maintenance_date',
            'effective_capacity',
            'description',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'organization', 'code']
        
    def get_effective_capacity(self, obj):
        """Show effective capacity for planning"""
        try:
            return obj.get_effective_capacity()
        except Exception as e:
            return 0
    
    def validate(self, data):
        """Add any custom validation here"""
        # Ensure capacity is positive
        if data.get('capacity_per_day_hours', 0) <= 0:
            raise serializers.ValidationError({
                'capacity_per_day_hours': 'Capacity must be greater than 0'
            })
        
        # Validate percentages are within range
        if data.get('efficiency_percentage', 100) < 0 or data.get('efficiency_percentage', 100) > 200:
            raise serializers.ValidationError({
                'efficiency_percentage': 'Efficiency must be between 0 and 200%'
            })
        
        if data.get('utilization_percentage', 100) < 0 or data.get('utilization_percentage', 100) > 100:
            raise serializers.ValidationError({
                'utilization_percentage': 'Utilization must be between 0 and 100%'
            })
        
        return data
    
    def validate_department(self, value):
        """Validate that the department exists and belongs to the user's organization"""
        if value:
            request = self.context.get('request')
            if request and request.user:
                # You might want to add organization validation here
                pass
        return value
from rest_framework import serializers
from .models import Dispatch, DispatchItem


class DispatchItemSerializer(serializers.ModelSerializer):
    item = serializers.IntegerField(write_only=True)
    name = serializers.CharField(source="item.name", read_only=True)
    uom = serializers.CharField(source="item.uom", read_only=True)
    ordered_qty = serializers.DecimalField(max_digits=10, decimal_places=2, write_only=True)  # <-- add this
    dispatch_qty = serializers.DecimalField(max_digits=10, decimal_places=2)
    rate = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        source="item.standard_price",
        read_only=True
    )

    taxable_value = serializers.SerializerMethodField()
    gst_rate = serializers.SerializerMethodField()
    gst_amount = serializers.SerializerMethodField()
    total_value = serializers.SerializerMethodField()

    class Meta:
        model = DispatchItem
        fields = [
           "item", "name", "dispatch_qty", "uom","ordered_qty",
            "rate", "taxable_value",
            "gst_rate", "gst_amount", "total_value"
        ]

    def get_taxable_value(self, obj):
        return obj.dispatch_qty * obj.item.standard_price

    def get_gst_rate(self, obj):
        gst = GSTSettings.objects.first()
        return gst.gst_rate if gst else 0

    def get_gst_amount(self, obj):
        gst = GSTSettings.objects.first()
        rate = gst.gst_rate if gst else 0
        return (obj.dispatch_qty * obj.item.standard_price * rate) / 100

    def get_total_value(self, obj):
        taxable = obj.dispatch_qty * obj.item.standard_price
        gst = self.get_gst_amount(obj)
        return taxable + gst
from apps.sales.models import GSTSettings
class DispatchSerializer(serializers.ModelSerializer):
    
    items = DispatchItemSerializer(many=True)
    

    sales_order_number = serializers.CharField(source="sales_order.so_number", read_only=True)

    organization = serializers.SerializerMethodField()
    gst_settings = serializers.SerializerMethodField()

    total_taxable = serializers.SerializerMethodField()
    total_gst = serializers.SerializerMethodField()
    grand_total = serializers.SerializerMethodField()

    class Meta:
        model = Dispatch
        fields = "__all__"

    def get_organization(self, obj):
        return {
            "name": obj.organization.name if obj.organization else "",
            "address": obj.organization.address if obj.organization else "",
        }

    def get_gst_settings(self, obj):
        gst = GSTSettings.objects.first()
        return {
            "gstin": gst.gstin if gst else ""
        }

    def get_total_taxable(self, obj):
        return sum([i.dispatch_qty * i.item.standard_price for i in obj.items.all()])

    def get_total_gst(self, obj):
        gst = GSTSettings.objects.first()
        rate = gst.gst_rate if gst else 0
        return sum([
            (i.dispatch_qty * i.item.standard_price * rate) / 100
            for i in obj.items.all()
        ])

    def get_grand_total(self, obj):
        return self.get_total_taxable(obj) + self.get_total_gst(obj)
    def create(self, validated_data):
        items_data = validated_data.pop("items", [])

        dispatch = Dispatch.objects.create(**validated_data)

        for item_data in items_data:
            DispatchItem.objects.create(
                dispatch=dispatch,
                item_id=item_data.get("item"),
                ordered_qty=item_data.get("ordered_qty"),
                dispatch_qty=item_data.get("dispatch_qty"),
            )

        return dispatch