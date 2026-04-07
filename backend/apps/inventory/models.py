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
from django.db.models import F

def get_next_number(prefix, org_id, model_class):
    current_year = timezone.now().year
    model_name = model_class.__name__
    if model_name == 'GateEntry':
        date_filter = {'entry_time__year': current_year}
    elif model_name == 'GRN':
        date_filter = {'received_date__year': current_year}
    else:
        date_filter = {'created_at__year': current_year}
    last_entry = model_class.objects.filter(
        organization_id=org_id,
        **date_filter
    ).order_by('-id').first()
    seq = 1
    if last_entry:
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
    ITEM_TYPE_CHOICES = [
        ('purchase', 'Purchase Item'),
        ('production', 'Production Item'),
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
    code = models.CharField(max_length=50, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='raw')
    
    item_type = models.CharField(
        max_length=20,
        choices=ITEM_TYPE_CHOICES,
        default='purchase'
    )
    uom = models.CharField(max_length=20, help_text="Unit of Measurement (e.g. Kg, Nos, Liter)")
    vendors = models.ManyToManyField('finance.Vendor', blank=True, related_name='items')  # adjust app name if needed
    standard_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ['name']
        verbose_name = "Item"
        verbose_name_plural = "Items"
    def __str__(self):
         return f"{self.name} ({self.code})" + (f" - {self.organization.name}" if self.organization else "")
    @property
    def current_stock(self) -> Decimal:
        from .models import GRNItem  # late import to avoid circular import
        total = GRNItem.objects.filter(
            item=self,
            grn__status='approved'
        ).aggregate(total=Sum('received_qty'))['total']
        return Decimal(total or '0.00')
    def get_department_stock(self, department_id=None):
        from .models import StockLedger

        qs = StockLedger.objects.filter(item=self)

        if department_id:
            qs = qs.filter(department_id=department_id)

        stock = qs.aggregate(
            total=Sum(
                Case(
                    When(transaction_type='IN', then='quantity'),
                    When(transaction_type='OUT', then=-1 * F('quantity')),
                    default=Value(0),
                    output_field=DecimalField()
                )
            )
        )['total']

        return Decimal(stock or 0)

    def is_production_item(self):
        return self.item_type == 'production'

    def is_purchase_item(self):
        return self.item_type == 'purchase'
    @property
    def available_stock(self) -> Decimal:
        return max(self.current_stock, Decimal('0.00'))
    @property
    def stock_value(self) -> Decimal:
        return self.current_stock * self.standard_price
    def stock_as_of(self, date):
        from .models import GRNItem
        total = GRNItem.objects.filter(
            item=self,
            grn__status='approved',
            grn__received_date__lte=date
        ).aggregate(total=Sum('received_qty'))['total']
        return Decimal(total or '0.00')
    def get_department_stock(self, department_id=None):
        
        from .models import StockLedger

        qs = StockLedger.objects.filter(item=self)

        if department_id:
            qs = qs.filter(department_id=department_id)

        stock = qs.aggregate(
            total=Sum(
                Case(
                    When(transaction_type='IN', then='quantity'),
                    When(transaction_type='OUT', then=-1 * F('quantity')),
                    default=Value(0),
                    output_field=DecimalField()
                )
            )
        )['total']

        return Decimal(stock or 0)
    
class ItemDependency(models.Model):
    """
    Defines BOM (Bill of Materials)
    Example: Table → Wood (5 qty)
    """

    parent_item = models.ForeignKey(
        Item,
        related_name='components',
        on_delete=models.CASCADE
    )

    child_item = models.ForeignKey(
        Item,
        related_name='used_in',
        on_delete=models.CASCADE
    )

    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Quantity required to produce parent item"
    )

    class Meta:
        unique_together = ('parent_item', 'child_item')

    def __str__(self):
        return f"{self.parent_item.name} → {self.child_item.name} ({self.quantity})"
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
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        if not self.po_number:
            self.po_number = get_next_number("PO", self.organization_id, PurchaseOrder)
        super().save(*args, **kwargs)

    def update_totals(self):
        """Calculate and update subtotal, tax, and grand total"""
        subtotal = sum(item.total_price for item in self.items.all())
        tax_amount = (subtotal * self.tax_percentage) / Decimal('100')
        grand_total = subtotal + tax_amount

        self.subtotal = subtotal
        self.tax_amount = tax_amount
        self.total_amount = grand_total
        self.save(update_fields=['subtotal', 'tax_amount', 'total_amount'])

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
        self.purchase_order.update_totals()

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
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(default="pending", max_length=20)

    def __str__(self):
        return self.invoice_number


# ========================= VENDOR PAYMENT =========================
class VendorPayment(models.Model):
    PAYMENT_MODES = [
        ('cash', 'Cash'),
        ('bank', 'Bank Transfer'),
        ('upi', 'UPI'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    invoice = models.ForeignKey('VendorInvoice', on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    payment_mode = models.CharField(max_length=20, choices=PAYMENT_MODES)
    reference_number = models.CharField(max_length=100, blank=True, null=True)

    payment_date = models.DateField(default=timezone.now)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)


# ========================= STOCK LEDGER =========================
class StockLedger(models.Model):
    item = models.ForeignKey(Item, on_delete=models.PROTECT, related_name='stock_movements')
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(
        max_length=10,
        choices=[('IN', 'Received'), ('OUT', 'Issued'), ('ADJ', 'Adjustment')]
    )
    department = models.ForeignKey(
    'apps_hr.Department',
    on_delete=models.PROTECT,
    null=True,
    blank=True
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

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from apps.hr.models import Department
import uuid


class Machine(models.Model):
    # Machine Types for different scheduling rules
    WORK_CENTER_TYPES = [
        ('machine', 'Machine Tool'),
        ('assembly', 'Assembly Station'),
        ('inspection', 'Quality Station'),
        ('labor', 'Manual Work'),
    ]
    
    MAINTENANCE_STATUS = [
        ('operational', 'Operational'),
        ('maintenance', 'Under Maintenance'),
        ('breakdown', 'Breakdown'),
    ]

    # Core Identification
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="machines"
    )
    department = models.ForeignKey(
        Department, 
        on_delete=models.PROTECT, 
        null=True,
        blank=True,
        related_name="machines"
    )
    name = models.CharField(max_length=200)
    code = models.CharField(
        max_length=50, 
        null=False,
        blank=False,
        default='MACHINE-' + str(uuid.uuid4())[:8],  # Temporary default for migration
        help_text="Unique machine code"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes or description about the machine"
    )
    
    # Type & Status
    work_center_type = models.CharField(
        max_length=20, 
        choices=WORK_CENTER_TYPES,
        default='machine',
        help_text="Type determines scheduling logic"
    )
    maintenance_status = models.CharField(
        max_length=20,
        choices=MAINTENANCE_STATUS,
        default='operational',
        help_text="Current operational status"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Available for production planning"
    )
    
    # === CAPACITY PLANNING FIELDS ===
    # Basic capacity
    capacity_per_day_hours = models.PositiveIntegerField(
        default=8,
        help_text="Hours available per day (e.g., 8 for single shift, 16 for double)"
    )
    
    # Efficiency factor (real-world performance)
    efficiency_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100.00,
        validators=[MinValueValidator(0), MaxValueValidator(200)],
        help_text="Efficiency % (new machine=95%, old=70%)"
    )
    
    # Utilization factor (planned downtime)
    utilization_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=100.00,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Utilization % (85% = 15% planned downtime)"
    )
    
    # === LEAD TIME FIELDS ===
    default_queue_time_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
        help_text="Hours job waits before processing"
    )
    
    setup_time_hours = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0,
        help_text="Standard setup/changeover time in hours"
    )
    
    # === COSTING FIELDS ===
    hourly_labor_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Cost per hour for operator"
    )
    
    hourly_overhead_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Cost per hour for electricity, maintenance"
    )
    
    # Maintenance tracking
    last_maintenance_date = models.DateField(null=True, blank=True)
    next_maintenance_date = models.DateField(null=True, blank=True)
    
    # Audit fields
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,  # Better to SET_NULL than CASCADE
        null=True,
        related_name="created_machines"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('organization', 'code')
        ordering = ['name']
        verbose_name = "Machine"
        verbose_name_plural = "Machines"

    def __str__(self):
        return f"{self.name} ({self.code})"
    
    def save(self, *args, **kwargs):
        """Auto-generate a truly unique code if not provided"""
        if not self.code:
            self.code = self.generate_unique_code()
        super().save(*args, **kwargs)
    
    def generate_unique_code(self):
        """Generate a truly unique code for the organization"""
        max_attempts = 10
        attempt = 0
        
        while attempt < max_attempts:
            # Method 1: Based on name + random string (preferred)
            if self.name:
                # Get first 3 letters of name, uppercase, keep only alphanumeric
                name_part = ''.join(c for c in self.name[:3].upper() if c.isalnum())
                if not name_part:  # If name has no alphanumeric chars
                    name_part = "MCH"
            else:
                name_part = "MCH"
            
            # Add random part (6 characters)
            random_part = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            code = f"{name_part}-{random_part}"
            
            # Check if code exists for this organization
            if not Machine.objects.filter(organization=self.organization, code=code).exists():
                return code
            
            attempt += 1
        
        # If all attempts fail, use UUID as fallback
        return f"MCH-{uuid.uuid4().hex[:8].upper()}"
    # === HELPER METHODS FOR MRP ===
    
    def get_effective_capacity(self, days=1):
        """
        Calculate actual available capacity considering efficiency and utilization
        Used by MRP for capacity planning
        """
        base_capacity = self.capacity_per_day_hours * days
        effective = base_capacity * (self.efficiency_percentage / 100) * (self.utilization_percentage / 100)
        return round(effective, 2)
    
    def to_decimal(self, value):
        return Decimal(str(value or 0))

    def calculate_lead_time(self, quantity, run_time_per_unit):
        quantity = self.to_decimal(quantity)
        run_time_per_unit = self.to_decimal(run_time_per_unit)

        total_run_time = quantity * run_time_per_unit

        total_time = (
            self.to_decimal(self.default_queue_time_hours) +
            self.to_decimal(self.setup_time_hours) +
            total_run_time
        )

        return total_time
    
    def calculate_operation_cost(self, quantity, run_time_per_unit):
        """
        Calculate total cost for an operation
        Used for product costing
        """
        hourly_rate = float(self.hourly_labor_cost) + float(self.hourly_overhead_cost)
        setup_cost = float(self.setup_time_hours) * hourly_rate
        run_cost = (quantity * run_time_per_unit) * hourly_rate
        return round(setup_cost + run_cost, 2)
    
    def is_available_for_scheduling(self, start_date, end_date):
        """
        Check if machine is available in date range
        Used by scheduling algorithm
        """
        if self.maintenance_status != 'operational' or not self.is_active:
            return False
        
        # Check if maintenance is scheduled in this period
        if self.next_maintenance_date:
            from datetime import date
            if isinstance(start_date, str):
                # Convert string dates if needed
                from django.utils.dateparse import parse_date
                start = parse_date(start_date) or date.today()
                end = parse_date(end_date) or date.today()
            else:
                start = start_date or date.today()
                end = end_date or date.today()
                
            if start <= self.next_maintenance_date <= end:
                return False
        
        return True