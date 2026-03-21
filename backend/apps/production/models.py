from django.db import models
from django.conf import settings
from decimal import Decimal
from datetime import timedelta

from apps.inventory.models import Item
from apps.organizations.models import Organization
from apps.sales.models import SalesOrder
from apps.hr.models import Department
from apps.inventory.models import Machine


User = settings.AUTH_USER_MODEL


# ────────────────────────────────────────────────
# Work Centers & Routing (existing - kept mostly as-is)
# ────────────────────────────────────────────────

# class WorkCenter(models.Model):
#     organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
#     name = models.CharField(max_length=200)
#     code = models.CharField(max_length=50, unique=True)
#     capacity_per_day_hours = models.DecimalField(max_digits=6, decimal_places=2, default=8.00)
#     number_of_machines = models.PositiveSmallIntegerField(default=1)
#     efficiency_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('85.00'))
#     created_at = models.DateTimeField(auto_now_add=True,null=True, blank=True)

#     class Meta:
#         verbose_name = "Work Center"
#         verbose_name_plural = "Work Centers"

#     def __str__(self):
#         return f"{self.name} ({self.code})"


class Routing(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    product = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='production_routings',          # ← FIXED: unique name
        related_query_name='production_routing'
    )
    name = models.CharField(max_length=200, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True ,null=True,blank=True)

    class Meta:
        verbose_name = "Routing (Work Center)"
        verbose_name_plural = "Routings (Work Center)"

    def __str__(self):
        return self.name or f"Routing for {self.product.name}"
from apps.inventory.models import Machine

# class WorkCenter(models.Model):

#     organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

#     name = models.CharField(max_length=200)

#     code = models.CharField(max_length=50)

#     capacity_per_day = models.PositiveIntegerField(default=8)

#     created_at = models.DateTimeField(auto_now_add=True)

#     def __str__(self):
#         return self.name

class BillOfMaterial(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    product = models.ForeignKey(Item, on_delete=models.CASCADE)
    version = models.CharField(max_length=20, default="v1")
    created_at = models.DateTimeField(auto_now_add=True)
    
    # ← Add this line
    is_active = models.BooleanField(default=True, help_text="Set to False to deactivate this BOM version")

class RoutingOperation(models.Model):

    routing = models.ForeignKey(
        Routing,
        on_delete=models.CASCADE,
        related_name="operations"
    )

    machine = models.ForeignKey(  # Changed from work_center to machine
        Machine, 
        on_delete=models.CASCADE,
        help_text="Machine/work center used for this operation"
    )

    operation_name = models.CharField(max_length=200)

    sequence = models.IntegerField()

    expected_hours = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return self.operation_name


# ────────────────────────────────────────────────
# Department-based Item Process / Routing
# ────────────────────────────────────────────────

class ItemProcess(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='department_routings',           # ← FIXED: different from production_routings
        related_query_name='department_routing'
    )
    name = models.CharField(max_length=200, blank=True, help_text="Optional name for this department routing")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Department Routing"
        verbose_name_plural = "Department Routings"
        unique_together = [['organization', 'item']]

    def __str__(self):
        return self.name or f"Dept Routing for {self.item.name}"


class ItemProcessStep(models.Model):
    process = models.ForeignKey(ItemProcess, on_delete=models.CASCADE, related_name="steps")
    sequence = models.PositiveIntegerField(db_index=True,null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT)

    class Meta:
        ordering = ["sequence"]
        unique_together = [["process", "sequence"]]

    def __str__(self):
        return f"{self.sequence}. {self.department.name}"


# ────────────────────────────────────────────────
# Department Transaction (department-level execution)
# ────────────────────────────────────────────────

class DepartmentTransaction(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    manufacturing_order = models.ForeignKey(
        'ManufacturingOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="department_transactions"
    )
    process_step = models.ForeignKey(
        ItemProcessStep,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="Link to the specific step in the department routing"
    )
    current_department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="current_transactions",
        null=True,
        blank=True
    )
    next_department = models.ForeignKey(
        Department,
        on_delete=models.PROTECT,
        related_name="incoming_transactions",
        null=True,
        blank=True
    )
    item = models.ForeignKey(Item, on_delete=models.PROTECT, null=True, blank=True)
    quantity = models.DecimalField(max_digits=12, decimal_places=3)
    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("in_progress", "In Progress"),
            ("completed", "Completed"),
        ],
        default="pending"
    )
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=['status', 'current_department']),
        ]
    machine = models.ForeignKey(  # Changed from work_center to machine
        Machine, 
        on_delete=models.CASCADE,
        help_text="Machine/work center used for this operation"
    )

    def __str__(self):
        return f"{self.item.name} @ {self.current_department.name} ({self.quantity})"

    def get_display_name(self):
        """Returns the visual name with department suffix (for UI/work queue)"""
        if self.status == "completed" and not self.next_department:
            return self.item.name  # Finished goods
        if not self.current_department:
            return f"{self.item.name} - Raw"
        return f"{self.item.name} - {self.current_department.name}"


# ────────────────────────────────────────────────
# MRP / Planning Models (kept mostly unchanged)
# ────────────────────────────────────────────────

class ProductionPlan(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    

    # Make this field optional
    sales_orders = models.ManyToManyField(
        'sales.SalesOrder',
        blank=True,
        related_name='production_plans'
    )
    planned_date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=[
            ("draft", "Draft"),
            ("planned", "Planned"),
            ("mrp_done", "MRP Done"),
            ("confirmed", "Confirmed"),
        ],
        default="draft"
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True, )

    def __str__(self):
        # FIX: Use sales_orders (ManyToMany) not sales_order (single)
        first_order = self.sales_orders.first()
        if first_order:
            return f"Plan {self.id} - {first_order.order_number}"
        return f"Plan {self.id} - MRP/Independent"

# apps/production/models.py - Updated PlannedOrder with nullable fields

class PlannedOrder(models.Model):
    # Status choices for order lifecycle
    STATUS_CHOICES = [
        ("planned", "Planned"),
        ("confirmed", "Confirmed"),
        ("converted", "Converted"),
        ("cancelled", "Cancelled"),
    ]
    
    # Scheduling type choices
    SCHEDULING_TYPE_CHOICES = [
        ('production', 'Production Order'),
        ('purchase', 'Purchase Order'),
        ('basic', 'Basic Scheduling'),
        ('lead_time', 'Lead Time Scheduling'),
    ]

    production_plan = models.ForeignKey(
        ProductionPlan,
        on_delete=models.CASCADE,
        related_name="planned_orders"
    )

    product = models.ForeignKey(Item, on_delete=models.CASCADE)

    quantity = models.PositiveIntegerField()

    planned_start = models.DateField()

    planned_finish = models.DateField()

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="planned"
    )
    
    scheduling_type = models.CharField(
        max_length=20,
        choices=SCHEDULING_TYPE_CHOICES,
        default='production'
    )
    
    # Make these fields nullable for existing data
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes about this planned order"
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        null=True,  # ← Add null=True for existing rows
        blank=True,
        help_text="When this planned order was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        null=True,  # ← Add null=True for existing rows
        blank=True,
        help_text="When this planned order was last updated"
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Planned Order"
        verbose_name_plural = "Planned Orders"

    def __str__(self):
        return f"{self.get_scheduling_type_display()}: {self.product.name} - {self.quantity} units"
    
    def save(self, *args, **kwargs):
        """Ensure scheduled dates are consistent"""
        if self.planned_start and self.planned_finish:
            if self.planned_finish < self.planned_start:
                raise ValueError("Planned finish date cannot be before planned start date")
        super().save(*args, **kwargs)
    
    @property
    def is_production_order(self):
        return self.scheduling_type == 'production'
    
    @property
    def is_purchase_order(self):
        return self.scheduling_type == 'purchase'
    
    @property
    def lead_days(self):
        if self.planned_start and self.planned_finish:
            return (self.planned_finish - self.planned_start).days
        return 0


class PurchaseRequisition(models.Model):
    production_plan = models.ForeignKey(ProductionPlan, on_delete=models.CASCADE, related_name="requisitions")
    material = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    required_date = models.DateField()
    status = models.CharField(
        max_length=20,
        default="open",
        choices=[("open", "Open"), ("converted", "Converted to PO")]
    )


class ManufacturingOrder(models.Model):
    planned_order = models.ForeignKey(PlannedOrder, on_delete=models.SET_NULL, null=True, blank=True)
    product = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=20,
        choices=[("draft", "Draft"), ("in_progress", "In Progress"), ("done", "Done")],
        default="draft"
    )
    start_date = models.DateField(null=True, blank=True)
    finish_date = models.DateField(null=True, blank=True)


class MOOperation(models.Model):

    manufacturing_order = models.ForeignKey(
        ManufacturingOrder,
        on_delete=models.CASCADE,
        related_name="operations"
    )

    machine = models.ForeignKey(  # Changed from work_center to machine
        Machine, 
        on_delete=models.CASCADE,
        help_text="Machine assigned for this operation"
    )

    operation_name = models.CharField(max_length=200)

    sequence = models.IntegerField()

    status = models.CharField(
        max_length=20,
        choices=[
            ("pending", "Pending"),
            ("in_progress", "In Progress"),
            ("done", "Done")
        ],
        default="pending"
    )
class BillOfMaterial(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    product = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='boms')
    version = models.CharField(max_length=20, default="v1")
    is_active = models.BooleanField(default=True, help_text="Set to False to deactivate this BOM version")
    created_at = models.DateTimeField(auto_now_add=True,)

    class Meta:
        ordering = ['-created_at']
        unique_together = ['product', 'version']
    machine = models.ForeignKey(  # Changed from work_center to machine
        Machine, 
        on_delete=models.CASCADE,
        help_text="Machine assigned for this operation"
    )

    def __str__(self):
        return f"BOM {self.version} - {self.product.name}"


class BOMLine(models.Model):
    bom = models.ForeignKey(BillOfMaterial, on_delete=models.CASCADE, related_name="lines")
    component = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=12, decimal_places=4)

    def __str__(self):
        return f"{self.component} × {self.quantity}"