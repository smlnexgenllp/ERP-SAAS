# apps/core/models.py (or create a new app 'modules')
from django.db import models
import uuid

class Module(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=100, blank=True)
    available_in_plans = models.JSONField(default=list)

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
