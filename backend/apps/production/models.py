from django.db import models
from django.conf import settings
from apps.inventory.models import Item
from apps.organizations.models import Organization
from apps.sales.models import SalesOrder


class WorkCenter(models.Model):

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    name = models.CharField(max_length=200)

    code = models.CharField(max_length=50)

    capacity_per_day = models.PositiveIntegerField(default=8)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


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

    work_center = models.ForeignKey(WorkCenter, on_delete=models.CASCADE)

    operation_name = models.CharField(max_length=200)

    sequence = models.IntegerField()

    expected_hours = models.DecimalField(max_digits=5, decimal_places=2)

    def __str__(self):
        return self.operation_name

class ProductionPlan(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    # Make this field optional
    sales_order = models.ForeignKey(
        'sales.SalesOrder',  # use string reference to avoid import issues
        on_delete=models.SET_NULL,  # or CASCADE, depending on your business rule
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

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        if self.sales_order:
            return f"Plan {self.id} - {self.sales_order.order_number}"
        return f"Plan {self.id} - MRP/Independent"

class PlannedOrder(models.Model):

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
        choices=[
            ("draft", "Draft"),
            ("confirmed", "Confirmed"),
            ("converted", "Converted")
        ],
        default="draft"
    )


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

    work_center = models.ForeignKey(WorkCenter, on_delete=models.CASCADE)

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