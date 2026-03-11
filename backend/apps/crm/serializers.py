

from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import (
    Contact, Opportunity, CallLog, Product, Activity, Customer,
    Quotation, QuotationItem
)

User = get_user_model()


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        extra_kwargs = {
            'organization': {'required': False},
        }

    def create(self, validated_data):
        request = self.context['request']
        validated_data['organization'] = request.user.organization
        return super().create(validated_data)


class ContactSerializer(serializers.ModelSerializer):

    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Contact
        fields = '__all__'
        extra_kwargs = {
            'organization': {'required': False},
            'created_by': {'required': False},
        }

    def create(self, validated_data):
        request = self.context['request']
        validated_data['organization'] = request.user.organization
        validated_data['created_by'] = request.user
        return super().create(validated_data)


class OpportunitySerializer(serializers.ModelSerializer):
    contact_name = serializers.CharField(source='contact.full_name', read_only=True)
    contact_email = serializers.EmailField(source='contact.email', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = Opportunity
        fields = [
            'id', 'title', 'contact', 'contact_name', 'contact_email',
            'stage', 'value', 'probability', 'expected_close_date',
            'actual_close_date', 'created_by', 'created_by_name',
            'created_at', 'updated_at', 'notes',
        ]
        read_only_fields = [
            'id', 'contact_name', 'contact_email', 'created_by_name',
            'created_at', 'updated_at',
        ]

    def validate(self, data):
        value = data.get('value')
        if value is not None and value <= 0:
            raise serializers.ValidationError({"value": "Value must be greater than zero."})

        probability = data.get('probability')
        if probability is not None and not 0 <= probability <= 100:
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
        if new_stage in [Opportunity.Stage.WON, Opportunity.Stage.LOST] and instance.stage not in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            validated_data['actual_close_date'] = timezone.now().date()
        return super().update(instance, validated_data)


class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = '__all__'
        extra_kwargs = {'created_by': {'required': False}}

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        return super().create(validated_data)


class CallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallLog
        fields = '__all__'



class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            'id', 'full_name', 'email', 'phone', 'company',
            'pan_number', 'gstin', 'aadhaar_number',
            'business_type', 'industry', 'alternate_phone',
            'billing_address', 'shipping_address',
            'payment_terms_days', 'credit_limit',
            'status', 'notes', 'customer_since', 'created_by'
        ]
        read_only_fields = ['customer_since', 'created_by']
class QuotationItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuotationItem
        fields = '__all__'


class QuotationSerializer(serializers.ModelSerializer):
    items = QuotationItemSerializer(many=True, required=False)

    class Meta:
        model = Quotation
        fields = '__all__'
        extra_kwargs = {'created_by': {'required': False}}

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        request = self.context['request']
        validated_data['created_by'] = request.user
        quotation = Quotation.objects.create(**validated_data)
        for item_data in items_data:
            QuotationItem.objects.create(quotation=quotation, **item_data)
        quotation.total = sum(item.subtotal for item in quotation.items.all())
        quotation.grand_total = quotation.total - quotation.discount + quotation.tax
        quotation.save()
        return quotation

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', [])
        instance = super().update(instance, validated_data)
        instance.items.all().delete()
        for item_data in items_data:
            QuotationItem.objects.create(quotation=instance, **item_data)
        instance.total = sum(item.subtotal for item in instance.items.all())
        instance.grand_total = instance.total - instance.discount + instance.tax
        instance.save()
        return instance




