# In apps/organizations/models.py
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Organization(models.Model):
    ORGANIZATION_TYPES = (
        ('main', 'Main Organization'),
        ('sub', 'Sub Organization'),
    )

    name = models.CharField(max_length=255)
    subdomain = models.CharField(max_length=100, unique=True)
    organization_type = models.CharField(max_length=20, choices=ORGANIZATION_TYPES, default='main')
    plan_tier = models.CharField(max_length=50, default='enterprise')
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
    # Add is_active field if you need it
    is_active = models.BooleanField(default=True)
    
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_organizations'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # For sub-organizations
    parent_organization = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='sub_organizations'
    )

    def __str__(self):
        return f"{self.name} ({self.subdomain})"

    class Meta:
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"