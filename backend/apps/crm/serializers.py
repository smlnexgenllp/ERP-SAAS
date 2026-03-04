# apps/crm/serializers.py

from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import (
    Contact, Opportunity, CallLog, Product, Activity, Customer,
    Quotation, QuotationItem, SalesOrder, SalesOrderItem,
    Invoice, InvoiceItem, Payment
)

User = get_user_model()


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'description', 'price', 'cost_price', 'sku',
            'stock_quantity', 'organization', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['organization', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        request = self.context['request']
        validated_data['organization'] = request.user.organization
        validated_data['created_by'] = request.user
        return super().create(validated_data)


class ContactSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='__str__', read_only=True)

    class Meta:
        model = Contact
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone', 'mobile',
            'company', 'position', 'status', 'notes', 'next_follow_up', 'address',
            'organization', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['organization', 'created_by', 'created_at', 'updated_at', 'full_name']

    def create(self, validated_data):
        request = self.context['request']
        validated_data['organization'] = request.user.organization
        validated_data['created_by'] = request.user
        return super().create(validated_data)


class OpportunitySerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.full_name', read_only=True)
    contact_email = serializers.EmailField(source='contact.email', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)

    class Meta:
        model = Opportunity
        fields = [
            'id', 'title', 'contact', 'contact_name', 'contact_email',
            'stage', 'stage_display', 'value', 'probability', 'expected_close_date',
            'actual_close_date', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'notes'
        ]
        read_only_fields = [
            'id', 'contact_name', 'contact_email', 'created_by_name', 'stage_display',
            'created_at', 'updated_at', 'actual_close_date'
        ]

    def validate(self, data):
        value = data.get('value')
        if value is not None and value <= 0:
            raise serializers.ValidationError({"value": "Value must be greater than zero."})

        probability = data.get('probability')
        if probability is not None and not (0 <= probability <= 100):
            raise serializers.ValidationError({"probability": "Probability must be between 0 and 100."})

        request = self.context.get('request')
        if request and request.user.organization:
            contact = data.get('contact')
            if contact and contact.organization != request.user.organization:
                raise serializers.ValidationError({"contact": "Contact must belong to your organization."})

        return data

    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['created_by'] = request.user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        new_stage = validated_data.get('stage', instance.stage)
        if new_stage in [Opportunity.Stage.WON, Opportunity.Stage.LOST] and \
           instance.stage not in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            validated_data['actual_close_date'] = timezone.now().date()
        return super().update(instance, validated_data)


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        return super().create(validated_data)


class CallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallLog
        fields = '__all__'
        read_only_fields = ['called_by', 'call_time']


class CustomerSerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.full_name', read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'contact', 'contact_name', 'organization', 'created_by',
            'customer_since', 'status', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'organization', 'created_by', 'created_at', 'updated_at', 'contact_name'
        ]

    def create(self, validated_data):
        request = self.context['request']
        validated_data['organization'] = request.user.organization
        validated_data['created_by'] = request.user
        return super().create(validated_data)


class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = '__all__'
        read_only_fields = ['subtotal']


class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True, read_only=False, required=False)
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    grand_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Quotation
        fields = [
            'id', 'opportunity', 'title', 'items', 'total', 'discount', 'tax',
            'grand_total', 'terms', 'created_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['total', 'grand_total', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context['request']
        validated_data['created_by'] = request.user
        quotation = Quotation.objects.create(**validated_data)

        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)

        quotation.update_totals()  # assuming you have a method or calculate here
        quotation.save()

        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance = super().update(instance, validated_data)

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                QuotationItem.objects.create(quotation=instance, **item_data)

        instance.update_totals()
        instance.save()
        return instance


# Similar pattern for SalesOrderSerializer and InvoiceSerializer
class SalesOrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesOrderItem
        fields = '__all__'
        read_only_fields = ['subtotal']


class SalesOrderSerializer(serializers.ModelSerializer):
    items = SalesOrderItemSerializer(many=True, read_only=False, required=False)
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    grand_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = SalesOrder
        fields = '__all__'
        read_only_fields = ['total', 'grand_total', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context['request']
        validated_data['created_by'] = request.user
        sales_order = SalesOrder.objects.create(**validated_data)

        for item_data in items_data:
            SalesOrderItem.objects.create(sales_order=sales_order, **item_data)

        sales_order.update_totals()  # implement or calculate here
        sales_order.save()
        return sales_order

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance = super().update(instance, validated_data)

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                SalesOrderItem.objects.create(sales_order=instance, **item_data)

        instance.update_totals()
        instance.save()
        return instance


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'
        read_only_fields = ['subtotal']


class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=False, required=False)
    total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    grand_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['total', 'grand_total', 'created_by', 'created_at', 'updated_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context['request']
        validated_data['created_by'] = request.user
        invoice = Invoice.objects.create(**validated_data)

        for item_data in items_data:
            InvoiceItem.objects.create(invoice=invoice, **item_data)

        invoice.update_totals()
        invoice.save()
        return invoice

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        instance = super().update(instance, validated_data)

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                InvoiceItem.objects.create(invoice=instance, **item_data)

        instance.update_totals()
        instance.save()
        return instance


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['created_by', 'created_at']