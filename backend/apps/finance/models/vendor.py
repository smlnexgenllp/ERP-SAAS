# backend/apps/purchase/models.py  (or wherever you place it)

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.organizations.models import Organization 
from django.db import transaction
from django.db.models import Max

class Vendor(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='vendors'
    )

    name = models.CharField(max_length=255, db_index=True)
    vendor_code = models.CharField(max_length=40, unique=True, editable=False, db_index=True)

    # Contact
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True, null=True)

    # Single address line as requested
    address = models.TextField(blank=True, help_text="Full address in one field")

    # Tax & Compliance
    gst_number = models.CharField(max_length=15, blank=True, verbose_name="GSTIN")
    pan_number = models.CharField(max_length=10, blank=True)
    msme_number = models.CharField(max_length=30, blank=True, verbose_name="MSME / UDYAM")

    # Classification
    vendor_type = models.CharField(
        max_length=50,
        choices=[
            ('local', 'Local'),
            ('outstation', 'Outstation'),
            ('import', 'Import/Overseas'),
            ('service', 'Service Provider'),
            ('goods', 'Goods Supplier'),
        ],
        default='goods'
    )

    payment_terms_days = models.PositiveIntegerField(default=30)

    is_active = models.BooleanField(default=True)
    is_approved = models.BooleanField(default=False)

    # Audit
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_vendors'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('organization', 'vendor_code')
        indexes = [
            models.Index(fields=['organization', 'name']),
            models.Index(fields=['organization', 'gst_number']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.vendor_code})"

    def clean(self):
        if self.gst_number and len(self.gst_number) != 15:
            raise ValidationError("GSTIN must be exactly 15 characters.")

    def save(self, *args, **kwargs):
        if not self.vendor_code:
            with transaction.atomic():
                prefix = self.organization.code or self.organization.subdomain.upper()[:6]

                last_code = Vendor.objects.filter(
                    organization=self.organization,
                    vendor_code__startswith=f"{prefix}-V"
                ).aggregate(
                    max_code=Max('vendor_code')
                )['max_code']

                if last_code:
                    num = int(last_code.split('-V')[-1]) + 1
                else:
                    num = 1

                self.vendor_code = f"{prefix}-V{num:04d}"

        super().save(*args, **kwargs)