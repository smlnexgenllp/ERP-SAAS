from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.organizations.models import Organization

class Voucher(models.Model):
    VOUCHER_TYPES = (
        ("PAYMENT", "Payment"),
        ("RECEIPT", "Receipt"),
        ("JOURNAL", "Journal"),
    )

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    voucher_type = models.CharField(max_length=20, choices=VOUCHER_TYPES)
    amount = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    narration = models.TextField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    released = models.BooleanField(default=False)
    released_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='released_vouchers'
    )

    def __str__(self):
        return f"{self.voucher_type} - {self.amount} ({self.organization.name})"

    class Meta:
        ordering = ['-created_at']
