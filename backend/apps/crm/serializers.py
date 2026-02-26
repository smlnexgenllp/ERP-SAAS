# apps/crm/serializers.py
from rest_framework import serializers
from .models import Contact, Opportunity

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = '__all__'

class OpportunitySerializer(serializers.ModelSerializer):
    contact_name = serializers.ReadOnlyField(source='contact.__str__')
    class Meta:
        model = Opportunity
        fields = '__all__'