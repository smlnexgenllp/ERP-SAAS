from django.db import models
from apps.organizations.models import Organization, OrganizationUser
from django.conf import settings

User = settings.AUTH_USER_MODEL

class MonthlyBudget(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE
    )
    year = models.PositiveIntegerField()
    month = models.PositiveIntegerField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    released = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="created_budgets"
    )
    released_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="released_budgets"
    )

    class Meta:
        unique_together = ("organization", "year", "month")
