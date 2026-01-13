# apps/finance/serializers/vendor.py
from rest_framework import serializers
from apps.finance.models.vendor import Vendor


class VendorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = [
            'id', 'name', 'vendor_code', 'email', 'phone', 'mobile', 'website',
            'address', 'gst_number', 'pan_number', 'msme_number', 'vendor_type',
            'payment_terms_days', 'is_active', 'is_approved',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'vendor_code', 'created_at', 'updated_at']