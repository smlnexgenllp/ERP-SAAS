from django.db import models
from django.conf import settings
from decimal import Decimal
from datetime import timedelta

from apps.inventory.models import Item
from apps.organizations.models import Organization
from apps.sales.models import SalesOrder
from apps.hr.models import Department

User = settings.AUTH_USER_MODEL


# ────────────────────────────────────────────────
# Work Centers & Routing (existing - kept mostly as-is)
# ────────────────────────────────────────────────

class WorkCenter(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    capacity_per_day_hours = models.DecimalField(max_digits=6, decimal_places=2, default=8.00)
    number_of_machines = models.PositiveSmallIntegerField(default=1)
    efficiency_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('85.00'))
    created_at = models.DateTimeField(auto_now_add=True,null=True, blank=True)

    class Meta:
        verbose_name = "Work Center"
        verbose_name_plural = "Work Centers"

    def __str__(self):
        return f"{self.name} ({self.code})"


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


class RoutingOperation(models.Model):
    routing = models.ForeignKey(Routing, on_delete=models.CASCADE, related_name="operations")
    work_center = models.ForeignKey(WorkCenter, on_delete=models.SET_NULL, null=True)
    operation_name = models.CharField(max_length=200)
    sequence = models.PositiveIntegerField()
    setup_time_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    machine_time_per_unit = models.DecimalField(max_digits=8, decimal_places=4, default=0)
    labor_time_per_unit = models.DecimalField(max_digits=8, decimal_places=4, default=0)

    class Meta:
        ordering = ['sequence']
        unique_together = [['routing', 'sequence']]

    def __str__(self):
        return f"{self.sequence}. {self.operation_name}"


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
    sales_order = models.ForeignKey(
        SalesOrder,
        on_delete=models.SET_NULL,
        null=True,
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
        if self.sales_order:
            return f"Plan {self.id} - {self.sales_order.order_number}"
        return f"Plan {self.id} - MRP/Independent"


class PlannedOrder(models.Model):
    production_plan = models.ForeignKey(ProductionPlan, on_delete=models.CASCADE, related_name="planned_orders")
    product = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    planned_start = models.DateField()
    planned_finish = models.DateField()
    scheduling_type = models.CharField(
        max_length=20,
        choices=[("basic", "Basic Date Scheduling"), ("leadtime", "Lead Time Scheduling")],
        default="basic"
    )
    status = models.CharField(
        max_length=20,
        choices=[("draft", "Draft"), ("confirmed", "Confirmed"), ("converted", "Converted")],
        default="draft"
    )


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
    manufacturing_order = models.ForeignKey(ManufacturingOrder, on_delete=models.CASCADE, related_name="operations")
    work_center = models.ForeignKey(WorkCenter, on_delete=models.SET_NULL, null=True)
    operation_name = models.CharField(max_length=200)
    sequence = models.PositiveIntegerField(null=True, blank=True)
    planned_start = models.DateTimeField(null=True, blank=True)
    planned_finish = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=[("pending", "Pending"), ("in_progress", "In Progress"), ("done", "Done")],
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

    def __str__(self):
        return f"BOM {self.version} - {self.product.name}"


class BOMLine(models.Model):
    bom = models.ForeignKey(BillOfMaterial, on_delete=models.CASCADE, related_name="lines")
    component = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.DecimalField(max_digits=12, decimal_places=4)

    def __str__(self):
        return f"{self.component} × {self.quantity}"