from django.db import models
from django.conf import settings
from apps.finance.models.vendor import Vendor 
from apps.organizations.models import Organization
User = settings.AUTH_USER_MODEL

class Item(models.Model):
    CATEGORY_CHOICES = [
        ('raw', 'Raw Material'),
        ('consumable', 'Consumable'),
        ('finished', 'Finished Goods'),
    ]

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    uom = models.CharField(max_length=20)  # Unit of Measure
    vendors = models.ManyToManyField(Vendor, blank=True)
    standard_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.code})"
class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('sent', 'Sent to Vendor'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    department = models.CharField(max_length=50)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)

    po_number = models.CharField(max_length=30, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.po_number
class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(
        PurchaseOrder,
        related_name="items",
        on_delete=models.CASCADE
    )
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
