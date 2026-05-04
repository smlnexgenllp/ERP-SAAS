from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.organizations.models import Organization
class GSTReconciliation(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('matched', 'Matched'),
        ('mismatch', 'Mismatch'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    reconciliation_month = models.CharField(max_length=20)
    invoice_number = models.CharField(max_length=100)
    customer_name = models.CharField(max_length=255, blank=True)
    gstin = models.CharField(max_length=20, blank=True)
    taxable_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gst_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    portal_taxable_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    portal_gst_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    mismatch_reason = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if (
            self.taxable_amount == self.portal_taxable_amount and
            self.gst_amount == self.portal_gst_amount
        ):
            self.status = 'matched'
        else:
            self.status = 'mismatch'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.reconciliation_month}"