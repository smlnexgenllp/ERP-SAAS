from rest_framework import serializers
from apps.crm.models import Contact
from apps.sales.models import Quotation, FollowUp
from rest_framework import serializers
from apps.crm.models import Customer
from rest_framework import serializers
from .models import SalesOrder, SalesOrderItem
from rest_framework import serializers
from .models import GSTSettings
from django.db.models import Sum

class GSTSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GSTSettings
        fields = ['gst_rate', 'gstin', 'company_name', 'address']

class SalesOrderItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = SalesOrderItem
        fields = "__all__"
        read_only_fields = ["sales_order", "subtotal"]


class SalesOrderSerializer(serializers.ModelSerializer):

    items = SalesOrderItemSerializer(many=True)
    computed_total = serializers.SerializerMethodField()  # ✅ ADD THIS

    class Meta:
        model = SalesOrder
        fields = "__all__"

        read_only_fields = [
            "order_number",
            "organization",
            "created_by",
            "created_at",
            "updated_at",
            "order_date"
        ]

    # ✅ CREATE METHOD FIX
    def create(self, validated_data):

        items_data = validated_data.pop("items", [])
        request = self.context["request"]

        order = SalesOrder.objects.create(
            organization=request.user.organization,
            created_by=request.user,
            **validated_data
        )

        total_subtotal = 0  # ✅ ADD

        for item in items_data:
            order_item = SalesOrderItem.objects.create(
                sales_order=order,
                **item
            )
            total_subtotal += order_item.subtotal  # ✅ ADD

        # ✅ UPDATE TOTALS
        order.subtotal = total_subtotal
        order.grand_total = total_subtotal - order.discount + order.gst_amount
        order.save()

        return order

    # ✅ FETCH TOTAL FROM ITEMS (for old data also)
    def get_computed_total(self, obj):
        total = obj.items.aggregate(total=Sum('subtotal'))['total']
        return total or 0
class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'full_name', 'email', 'phone', 'company',
            'pan_number', 'gstin', 'aadhaar_number',
            'business_type', 'industry', 'alternate_phone',
            'billing_address', 'shipping_address',
            'payment_terms_days', 'credit_limit',
            'status', 'notes', 'customer_since'
        ]

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = ['id', 'full_name', 'email', 'phone', 'company', 'status', 'created_at']

class QuotationSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    pdf_url = serializers.SerializerMethodField()

    class Meta:
        model = Quotation
        fields = [
            'id', 'quote_number', 'status', 'customer_name', 'customer_email',
            'grand_total', 'validity_date', 'notes', 'created_at', 'created_by_name',
            'pdf_url', 'approved_at'
        ]

    def get_pdf_url(self, obj):
        return obj.pdf_file.url if obj.pdf_file else None

class FollowUpSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = FollowUp
        fields = ['id', 'followup_type', 'status', 'scheduled_at', 'completed_at', 'notes', 'created_by_name', 'created_at']
from rest_framework import serializers
from .models import SalesInvoice, SalesInvoiceItem, SalesPayment

# apps/sales/serializers.py

from rest_framework import serializers
from .models import SalesInvoice, SalesInvoiceItem

class SalesInvoiceItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    hsn = serializers.CharField(source='item.hsn_code', read_only=True)   # change if your field name is different

    class Meta:
        model = SalesInvoiceItem
        fields = [
            'id',
            'item',
            'item_name',
            'hsn',
            'quantity',
            'rate',
            'gst_rate',
            # Remove these if they don't exist on the model:
            # 'taxable_value', 'gst_amount', 'amount'
        ]
        # If you have calculated fields, compute them in serializer or in model

    # Optional: Calculate on the fly if fields don't exist in model
    def to_representation(self, instance):
        data = super().to_representation(instance)
        
        qty = float(instance.quantity or 0)
        rate = float(instance.rate or 0)
        gst_rate = float(instance.gst_rate or 18)

        taxable = qty * rate
        gst_amount = taxable * (gst_rate / 100)
        total_amount = taxable + gst_amount

        data['taxable_value'] = round(taxable, 2)
        data['gst_amount'] = round(gst_amount, 2)
        data['amount'] = round(total_amount, 2)

        return data
class SalesInvoiceSerializer(serializers.ModelSerializer):
    items = SalesInvoiceItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_address = serializers.CharField(source='customer.billing_address', read_only=True)
    customer_gstin = serializers.CharField(source='customer.gstin', read_only=True)
    dispatch_id = serializers.IntegerField(source="dispatch.id", read_only=True)
    dispatch_number = serializers.CharField(source="dispatch.dc_number", read_only=True)
    amount_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    class Meta:
        model = SalesInvoice
        fields = [
            'id',
            'invoice_number',
            'invoice_date',
            'customer',
            'customer_name',
            'customer_address',
            'customer_gstin',
            'status',
            'grand_total',
            'items',
            'dispatch_id',
            'dispatch_number',
            'amount_paid',
        ]
class SalesPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesPayment
        fields = '__all__'