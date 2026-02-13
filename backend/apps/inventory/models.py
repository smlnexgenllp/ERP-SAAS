from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Sum,Case, When, Value, DecimalField
from django.db.models.functions import Coalesce
from decimal import Decimal
from apps.finance.models.vendor import Vendor
from apps.organizations.models import Organization

User = settings.AUTH_USER_MODEL


def get_next_number(prefix, org_id, model_class):
    """
    Generate sequential number: PREFIX/ORG_ID/YEAR/SEQ (4 digits)
    Uses the correct date field for each model
    """
    current_year = timezone.now().year

    model_name = model_class.__name__

    # Model-specific date field for year filtering
    if model_name == 'GateEntry':
        date_filter = {'entry_time__year': current_year}
    elif model_name == 'GRN':
        date_filter = {'received_date__year': current_year}
    else:
        # Default for PurchaseOrder, Item, etc.
        date_filter = {'created_at__year': current_year}

    last_entry = model_class.objects.filter(
        organization_id=org_id,
        **date_filter
    ).order_by('-id').first()

    seq = 1
    if last_entry:
        # Select the correct number field based on model
        number_field = (
            getattr(last_entry, 'gate_entry_number', '') if model_name == 'GateEntry' else
            getattr(last_entry, 'po_number', '') if model_name == 'PurchaseOrder' else
            getattr(last_entry, 'grn_number', '') if model_name == 'GRN' else
            ''
        )
        if number_field:
            try:
                parts = number_field.rsplit('/', 1)
                if len(parts) == 2:
                    seq = int(parts[1]) + 1
            except (ValueError, IndexError):
                pass

    return f"{prefix}/{org_id}/{current_year}/{seq:04d}"


class Item(models.Model):
    CATEGORY_CHOICES = [
        ('raw', 'Raw Material'),
        ('consumable', 'Consumable'),
        ('finished', 'Finished Goods'),
    ]

    # NEW: Organization scoping (critical for multi-tenant)
    organization = models.ForeignKey(
    'organizations.Organization',
    on_delete=models.CASCADE,
    related_name='items',
    null=True,          # ← add this
    blank=True          # ← add this
)

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)  # unique across whole system
    # If you want code unique per organization → use this instead:
    # code = models.CharField(max_length=50, unique=False)
    # class Meta:
    #     unique_together = ('organization', 'code')

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='raw')
    uom = models.CharField(max_length=20, help_text="Unit of Measurement (e.g. Kg, Nos, Liter)")
    vendors = models.ManyToManyField('finance.Vendor', blank=True, related_name='items')  # adjust app name if needed
    standard_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Item"
        verbose_name_plural = "Items"
        # Optional: make code unique per organization
        # unique_together = ('organization', 'code')

    def __str__(self):
         return f"{self.name} ({self.code})" + (f" - {self.organization.name}" if self.organization else "")

    # ────────────────────── STOCK CALCULATION (from GRN) ──────────────────────
    @property
    def current_stock(self) -> Decimal:
        """
        Current physical stock = Sum of received_qty from all APPROVED GRNs
        This is 100% accurate as long as you only have inward movements via GRN.
        """
        from .models import GRNItem  # late import to avoid circular import

        total = GRNItem.objects.filter(
            item=self,
            grn__status='approved'
        ).aggregate(total=Sum('received_qty'))['total']

        return Decimal(total or '0.00')

    @property
    def available_stock(self) -> Decimal:
        """For UI display – never show negative stock"""
        return max(self.current_stock, Decimal('0.00'))

    @property
    def stock_value(self) -> Decimal:
        """Current stock value = current_stock × standard_price"""
        return self.current_stock * self.standard_price

    def stock_as_of(self, date):
        """Historical stock on a specific date"""
        from .models import GRNItem
        total = GRNItem.objects.filter(
            item=self,
            grn__status='approved',
            grn__received_date__lte=date
        ).aggregate(total=Sum('received_qty'))['total']
        return Decimal(total or '0.00')

# ========================= PURCHASE ORDER =========================
class PurchaseOrder(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('approved', 'Approved'),
        ('closed', 'Closed'),
        ('cancelled', 'Cancelled'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    department = models.CharField(max_length=50)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    po_number = models.CharField(max_length=30, unique=True, editable=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.po_number:
            self.po_number = get_next_number("PO", self.organization_id, PurchaseOrder)
        super().save(*args, **kwargs)

    def update_total(self):
        total = sum(i.total_price for i in self.items.all())
        self.total_amount = total
        self.save(update_fields=["total_amount"])

    def check_and_close(self):
        all_closed = all(i.received_qty >= i.ordered_qty for i in self.items.all())
        if all_closed and self.status == 'approved':
            self.status = 'closed'
            self.save(update_fields=['status'])

    def __str__(self):
        return self.po_number


class PurchaseOrderItem(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, related_name="items", on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    ordered_qty = models.DecimalField(max_digits=10, decimal_places=2)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2, editable=False)
    received_qty = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.total_price = self.ordered_qty * self.unit_price
        super().save(*args, **kwargs)
        self.purchase_order.update_total()

    def __str__(self):
        return f"{self.item} - {self.ordered_qty} {self.item.uom}"


# ========================= GATE ENTRY =========================
class GateEntry(models.Model):
    STATUS_CHOICES = [
        ('pending_qc',     'Pending QC'),
        ('qc_in_progress', 'QC In Progress'),
        ('qc_passed',      'QC Passed'),
        ('qc_rejected',    'QC Rejected'),
        ('grn_created',    'GRN Created'),
        ('cancelled',      'Cancelled'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    po = models.ForeignKey(PurchaseOrder, on_delete=models.PROTECT)
    gate_entry_number = models.CharField(max_length=50, unique=True, editable=False)
    dc_number = models.CharField(max_length=100, blank=True, null=True)
    vehicle_number = models.CharField(max_length=20)
    challan_number = models.CharField(max_length=50)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_qc')
    entry_time = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.gate_entry_number:
            self.gate_entry_number = get_next_number("GE", self.organization_id, GateEntry)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.vehicle_number} | {self.po.po_number}"


class GateEntryItem(models.Model):
    gate_entry = models.ForeignKey(GateEntry, related_name="items", on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    delivered_qty = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.item} - {self.delivered_qty}"


# ========================= GRN =========================class GRN(models.Model):
class GRN(models.Model):
    STATUS_CHOICES = [
        ('pending_approval', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]

    organization = models.ForeignKey(
        'organizations.Organization',  # adjust app name if needed
        on_delete=models.CASCADE
    )

    po = models.ForeignKey('inventory.PurchaseOrder', on_delete=models.PROTECT)

    # Make gate entry optional
    gate_entry = models.ForeignKey(
        'inventory.GateEntry',  # adjust app name if needed
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    quality_inspection = models.ForeignKey(
        'inventory.QualityInspection',  # adjust app name if needed
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    grn_number = models.CharField(
        max_length=50,
        unique=True,
        editable=False
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending_approval'
    )

    received_date = models.DateField(auto_now_add=True)

    # ── NEW FIELDS FOR APPROVAL WORKFLOW ────────────────────────────────
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_grns',
        help_text="User who approved this GRN"
    )

    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date and time when this GRN was approved"
    )

    def save(self, *args, **kwargs):
        if not self.grn_number:
            self.grn_number = get_next_number("GRN", self.organization_id, GRN)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.grn_number

    class Meta:
        ordering = ['-received_date']
        verbose_name = "Goods Received Note"
        verbose_name_plural = "Goods Received Notes"


class GRNItem(models.Model):
    grn = models.ForeignKey(GRN, related_name="items", on_delete=models.CASCADE)
    item = models.ForeignKey('inventory.Item', on_delete=models.PROTECT)
    received_qty = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.item} - {self.received_qty}"

    class Meta:
        verbose_name = "GRN Item"
        verbose_name_plural = "GRN Items"


# ========================= QUALITY INSPECTION =========================
class QualityInspection(models.Model):
    gate_entry = models.ForeignKey(GateEntry, on_delete=models.CASCADE, related_name='inspections')
    inspected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    remarks = models.TextField(blank=True)
    inspection_date = models.DateField(auto_now_add=True)
    is_approved = models.BooleanField(default=False)  # final decision

    class Meta:
        ordering = ['-inspection_date']

    def __str__(self):
        return f"QC {self.id} for {self.gate_entry.gate_entry_number}"


class QualityInspectionItem(models.Model):
    quality_inspection = models.ForeignKey(QualityInspection, related_name="items", on_delete=models.CASCADE)
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    accepted_qty = models.DecimalField(max_digits=10, decimal_places=2)
    rejected_qty = models.DecimalField(max_digits=10, decimal_places=2)

    def clean(self):
        super().clean()
        gate_item = GateEntryItem.objects.filter(
            gate_entry=self.quality_inspection.gate_entry,
            item=self.item
        ).first()
        if gate_item:
            if self.accepted_qty + self.rejected_qty != gate_item.delivered_qty:
                raise ValidationError("Accepted + Rejected must equal delivered quantity")

    def __str__(self):
        return f"{self.item} - Acc: {self.accepted_qty}, Rej: {self.rejected_qty}"


# ========================= VENDOR INVOICE =========================
class VendorInvoice(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    grn = models.ForeignKey(GRN, on_delete=models.PROTECT)
    invoice_number = models.CharField(max_length=50, unique=True)
    invoice_date = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return self.invoice_number


# ========================= VENDOR PAYMENT =========================
class VendorPayment(models.Model):
    vendor = models.ForeignKey(Vendor, on_delete=models.PROTECT)
    invoice = models.ForeignKey(VendorInvoice, on_delete=models.PROTECT)
    payment_date = models.DateField(auto_now_add=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_mode = models.CharField(max_length=20)

    def __str__(self):
        return f"Payment for {self.invoice}"


# ========================= STOCK LEDGER =========================
class StockLedger(models.Model):
    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name='stock_movements')
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(
        max_length=10,
        choices=[('IN', 'Received'), ('OUT', 'Issued'), ('ADJ', 'Adjustment')]
    )
    reference = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['item', 'created_at']),
        ]

    def __str__(self):
        return f"{self.item.code} | {self.quantity:+.2f} | {self.transaction_type}"