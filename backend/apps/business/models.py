from django.db import models
from django.conf import settings
from apps.organizations.models import Organization


class DashboardPreference(models.Model):
    """
    Stores dashboard preferences for each organization.
    Business analytics data itself is NOT stored here.
    """

    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name="business_dashboard"
    )

    dashboard_name = models.CharField(max_length=100, default="Business Dashboard")

    refresh_interval = models.PositiveIntegerField(
        default=300,
        help_text="Refresh interval in seconds"
    )

    show_sales = models.BooleanField(default=True)
    show_inventory = models.BooleanField(default=True)
    show_crm = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "business_dashboard_preferences"

    def __str__(self):
        return f"{self.organization.name} Dashboard"