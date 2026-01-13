from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from apps.finance.models.budget import MonthlyBudget
from decimal import Decimal


class DepartmentBudget(models.Model):
    DEPARTMENT_CHOICES = (
        ("HR", "HR / Payroll"),
        ("INVENTORY", "Inventory"),
        ("WAREHOUSE", "Warehouse"),
        ("SALES", "Sales"),
        # Consider adding more as your ERP grows
        # ("MARKETING", "Marketing"),
        # ("ADMIN", "Administration"),
    )

    monthly_budget = models.ForeignKey(
        MonthlyBudget,
        on_delete=models.CASCADE,
        related_name="department_budgets",
        verbose_name="Monthly Budget"
    )
    
    department = models.CharField(
        max_length=30,
        choices=DEPARTMENT_CHOICES,
        verbose_name="Department"
    )

    allocated_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Allocated Amount"
    )

    used_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        verbose_name="Used / Spent Amount",
        help_text="Automatically updated when expenses/vouchers are posted"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_department_budgets",
        verbose_name="Created By"
    )

    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("monthly_budget", "department")
        verbose_name = "Department Budget Allocation"
        verbose_name_plural = "Department Budget Allocations"
        ordering = ["department"]

    from decimal import Decimal

    @property
    def remaining_amount(self):
        allocated = Decimal(self.allocated_amount or 0)
        used = Decimal(self.used_amount or 0)
        return allocated - used


    @property
    def remaining_percentage(self):
        """Percentage of budget still available (0-100)"""
        if self.allocated_amount <= 0:
            return Decimal('0.00')
        return (self.remaining_amount / self.allocated_amount) * Decimal('100')

    @property
    def is_over_budget(self):
        return self.remaining_amount < 0

    def __str__(self):
        return f"{self.get_department_display()} – {self.monthly_budget}"

    def clean(self):
        """Extra safety (optional)"""
        if self.allocated_amount < 0:
            raise ValidationError({"allocated_amount": "Cannot be negative"})
        if self.used_amount < 0:
            raise ValidationError({"used_amount": "Cannot be negative"})