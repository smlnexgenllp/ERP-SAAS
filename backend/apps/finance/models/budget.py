from django.utils import timezone

from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from apps.organizations.models import Organization

User = settings.AUTH_USER_MODEL


class MonthlyBudget(models.Model):
   
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name="monthly_budgets"
    )

    # Always store as first day of month (YYYY-MM-01)
    month = models.DateField(
        help_text="Budget month (use first day of the month)"
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    # Release control
    released = models.BooleanField(default=False)
    released_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="released_budgets"
    )

    # Month close (LOCK)
    is_closed = models.BooleanField(default=False)
    closed_at = models.DateTimeField(null=True, blank=True)
    closed_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="closed_budgets"
    )

    # Snapshot of allocations (for audit / fast reads)
    department_allocations = models.JSONField(
        default=dict,
        blank=True,
        help_text="Snapshot of department-wise allocations"
    )

    # Audit fields
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_budgets"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("organization", "month")
        ordering = ["-month"]
        indexes = [
            models.Index(fields=["organization", "month"]),
            models.Index(fields=["is_closed"]),
        ]

    def __str__(self):
        return f"{self.organization.name} | {self.month.strftime('%Y-%m')}"

    # ----------------------------
    # VALIDATIONS
    # ----------------------------
    def clean(self):
        # Always normalize month to first day
        if self.month.day != 1:
            raise ValidationError({
                "month": "Month must be the first day of the month (YYYY-MM-01)."
            })

        # Prevent amount change after close
        if self.pk:
            old = MonthlyBudget.objects.get(pk=self.pk)
            if old.is_closed and old.amount != self.amount:
                raise ValidationError(
                    "Cannot modify amount after month is closed."
                )

    # ----------------------------
    # BUSINESS LOGIC
    # ----------------------------
    def close_month(self, user):
        """
        Lock this budget permanently.
        """
        if self.is_closed:
            raise ValidationError("Budget already closed.")

        self.is_closed = True

        self.closed_at = timezone.now()

        self.closed_by = user
        self.save(update_fields=["is_closed", "closed_at", "closed_by"])

    def can_allocate(self):
        return not self.is_closed

    def total_allocated(self):
        return sum(
            float(v) for v in self.department_allocations.values()
        )

    def remaining_amount(self):
        return float(self.amount) - self.total_allocated()
