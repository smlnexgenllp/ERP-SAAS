import uuid
from django.db import models
from apps.organizations.models import Organization

class Module(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    available_in_plans = models.JSONField(default=list)  

    def __str__(self):
        return self.name


class ModulePage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    module = models.ForeignKey(Module, related_name='pages', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    path = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    order = models.IntegerField(default=0)
    required_permission = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return f"{self.module.name} - {self.name}"


class OrganizationModule(models.Model):
    """Assign modules to organizations (main or sub-orgs)"""
    organization = models.ForeignKey(Organization, related_name='modules_organization_modules', on_delete=models.CASCADE)
    module = models.ForeignKey(Module, on_delete=models.CASCADE)
    is_active = models.BooleanField(default=False)
    accessible_pages = models.JSONField(default=list) 

    class Meta:
        unique_together = ("organization", "module")

    def __str__(self):
        return f"{self.organization.name} - {self.module.name}"
