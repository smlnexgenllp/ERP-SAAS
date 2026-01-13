# backend/apps/purchase/models.py  (or wherever you place it)

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.organizations.models import Organization 


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
        # Auto-generate vendor_code only on creation
        if not self.vendor_code:
            prefix = self.organization.code or self.organization.subdomain.upper()[:6]
            last_vendor = Vendor.objects.filter(
                organization=self.organization
            ).order_by('-id').first()

            if last_vendor and last_vendor.vendor_code.startswith(prefix):
                try:
                    num = int(last_vendor.vendor_code.split('-')[-1]) + 1
                except:
                    num = 1
            else:
                num = 1

            self.vendor_code = f"{prefix}-V{num:04d}"  # e.g., SKMT-V0001

        super().save(*args, **kwargs)