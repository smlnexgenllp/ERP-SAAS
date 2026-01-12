# apps/accounts/models/party.py
from django.db import models
from apps.organizations.models import Organization

class Party(models.Model):
    PARTY_TYPES = (
        ("CUSTOMER", "Customer"),
        ("VENDOR", "Vendor"),
        ("EMPLOYEE", "Employee"),
        ("BANK", "Bank"),
        ("CASH", "Cash"),
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="parties"
    )
    name = models.CharField(max_length=255)
    party_type = models.CharField(max_length=20, choices=PARTY_TYPES)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.name} ({self.party_type})"
