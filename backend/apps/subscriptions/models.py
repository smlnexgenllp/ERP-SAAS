from django.db import models
import uuid

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

class Module(models.Model):
    module_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    available_in_plans = models.JSONField(default=list)  # ['basic', 'advance', 'enterprise']
    app_name = models.CharField(max_length=100)
    base_url = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)
    
    def __str__(self):
        return self.name

# apps/subscriptions/models.py (or wherever ModulePage lives)
from django.utils.text import slugify

class ModulePage(models.Model):
    page_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='pages')
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=50, blank=True)
    path = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True)
    order = models.IntegerField(default=0)
    required_permission = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['module', 'code']

    def save(self, *args, **kwargs):
        if not self.code:
            module_code = self.module.code.upper()
            page_code = slugify(self.name).replace("-", "_").upper()
            self.code = f"{module_code}_{page_code}_PAGE"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.module.name} - {self.name}"


class Subscription(models.Model):
    organization = models.OneToOneField('organizations.Organization', on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    status = models.CharField(max_length=20, default='active')  # active, expired, cancelled
    is_trial = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.organization.name} - {self.plan.name}"

class OrganizationModule(models.Model):
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, related_name='organization_modules')
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    accessible_pages = models.JSONField(default=list)  # List of page UUIDs
    granted_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True)
    granted_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['organization', 'module']
    
    def __str__(self):
        return f"{self.organization.name} - {self.module.name}"

# Add this to your apps/subscriptions/models.py if you need PlanModule

class PlanModule(models.Model):
    """Defines which modules are available in which subscription plans"""
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE, related_name='plan_modules')
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    is_included = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['plan', 'module']
        verbose_name = 'Plan Module'
        verbose_name_plural = 'Plan Modules'
    
    def __str__(self):
        return f"{self.plan.name} - {self.module.name}"        