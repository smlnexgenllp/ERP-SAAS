# apps/crm/serializers.py
from rest_framework import serializers
from apps.crm.models import Contact

class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contact
        fields = [
            'id', 'full_name', 'email', 'phone', 'company',
            'status', 'created_at',  # add any other fields you want to expose
        ]
        read_only_fields = ['id', 'created_at']