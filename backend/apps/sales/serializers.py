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