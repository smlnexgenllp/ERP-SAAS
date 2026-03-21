from django.db import models
from django.conf import settings
from apps.inventory.models import Item
from apps.organizations.models import Organization
from apps.sales.models import SalesOrder
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

    class Meta:
        ordering = ['-created_at']
        unique_together = ['product', 'version']  # optional but useful

    def __str__(self):
        return f"BOM {self.version} - {self.product.name}"


class BOMLine(models.Model):

    bom = models.ForeignKey(
        BillOfMaterial,
        on_delete=models.CASCADE,
        related_name="lines"
    )

    material = models.ForeignKey(Item, on_delete=models.CASCADE)

    quantity = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.material} ({self.quantity})"


class Routing(models.Model):

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    product = models.ForeignKey(Item, on_delete=models.CASCADE)

    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


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

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

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


class ManufacturingOrder(models.Model):

    planned_order = models.ForeignKey(
        PlannedOrder,
        on_delete=models.CASCADE
    )

    product = models.ForeignKey(Item, on_delete=models.CASCADE)

    quantity = models.PositiveIntegerField()

    status = models.CharField(
        max_length=20,
        choices=[
            ("draft", "Draft"),
            ("in_progress", "In Progress"),
            ("done", "Done")
        ],
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