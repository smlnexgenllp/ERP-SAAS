# apps/crm/serializers.py

from rest_framework import serializers
from django.utils import timezone
from django.contrib.auth import get_user_model
from .models import Contact, Opportunity, CallLog

User = get_user_model()


# =========================
# CONTACT SERIALIZER
# =========================
class ContactSerializer(serializers.ModelSerializer):
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


# =========================
# OPPORTUNITY SERIALIZER
# =========================
class OpportunitySerializer(serializers.ModelSerializer):

    contact_name = serializers.CharField(
        source='contact.full_name',
        read_only=True
    )
    contact_email = serializers.EmailField(
        source='contact.email',
        read_only=True
    )
    assigned_to_name = serializers.CharField(
        source='assigned_to.get_full_name',
        read_only=True,
        allow_null=True
    )
    created_by_name = serializers.CharField(
        source='created_by.get_full_name',
        read_only=True
    )

    class Meta:
        model = Opportunity
        fields = [
            'id',
            'title',
            'contact',
            'contact_name',
            'contact_email',
            'stage',
            'status',
            'expected_value',
            'probability',
            'expected_close_date',
            'actual_close_date',
            'assigned_to',
            'assigned_to_name',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
            'notes',
            'tags',
        ]

        read_only_fields = [
            'id',
            'contact_name',
            'contact_email',
            'assigned_to_name',
            'created_by_name',
            'created_at',
            'updated_at',
        ]

    # -------------------------
    # VALIDATION
    # -------------------------
    def validate(self, data):

        expected_value = data.get('expected_value')
        if expected_value is not None and expected_value <= 0:
            raise serializers.ValidationError({
                "expected_value": "Expected value must be greater than zero."
            })

        probability = data.get('probability')
        if probability is not None:
            if not 0 <= probability <= 100:
                raise serializers.ValidationError({
                    "probability": "Probability must be between 0 and 100."
                })

        # Handle closed validation safely
        status_value = data.get('status')
        instance = getattr(self, 'instance', None)

        if status_value in ['won', 'lost', 'closed']:
            actual_close_date = data.get(
                'actual_close_date',
                getattr(instance, 'actual_close_date', None)
            )

            if not actual_close_date:
                raise serializers.ValidationError({
                    "actual_close_date": "Actual close date is required when opportunity is closed."
                })

        # Security: Contact must belong to same organization
        request = self.context.get('request')
        if request and request.user.organization:
            contact = data.get('contact')
            if contact and contact.organization != request.user.organization:
                raise serializers.ValidationError({
                    "contact": "Contact must belong to your organization."
                })

        return data

    # -------------------------
    # CREATE
    # -------------------------
    def create(self, validated_data):
        request = self.context.get('request')
        if request:
            validated_data['created_by'] = request.user
        return super().create(validated_data)

    # -------------------------
    # UPDATE
    # -------------------------
    def update(self, instance, validated_data):

        request = self.context.get('request')
        new_status = validated_data.get('status', instance.status)

        if new_status in ['won', 'lost', 'closed'] and instance.status not in ['won', 'lost', 'closed']:
            validated_data['actual_close_date'] = timezone.now().date()

        return super().update(instance, validated_data)


# =========================
# OPPORTUNITY MINIMAL
# =========================
class OpportunityMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Opportunity
        fields = ['id', 'title', 'stage', 'status', 'expected_value', 'probability']


# =========================
# CALL LOG SERIALIZER
# =========================
class CallLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = CallLog
        fields = '__all__'