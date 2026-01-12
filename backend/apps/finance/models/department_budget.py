from django.db import models
from django.conf import settings
from apps.finance.models.budget import MonthlyBudget

class DepartmentBudget(models.Model):
    DEPARTMENT_CHOICES = (
        ("HR", "HR / Payroll"),
        ("INVENTORY", "Inventory"),
        ("WAREHOUSE", "Warehouse"),
        ("SALES", "Sales"),
    )

    monthly_budget = models.ForeignKey(
        MonthlyBudget,
        on_delete=models.CASCADE,
        related_name="department_budgets"
    )
    department = models.CharField(max_length=30, choices=DEPARTMENT_CHOICES)

    allocated_amount = models.DecimalField(max_digits=14, decimal_places=2)
    used_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )

    class Meta:
        unique_together = ("monthly_budget", "department")

    @property
    def remaining_amount(self):
        return self.allocated_amount - self.used_amount

    def __str__(self):
        return f"{self.department} - {self.monthly_budget}"
