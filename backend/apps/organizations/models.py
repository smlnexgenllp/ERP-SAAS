# In apps/organizations/models.py
from django.db import models
from django.contrib.auth import get_user_model
from django.conf import settings
User = get_user_model()

class Organization(models.Model):
    ORGANIZATION_TYPES = (
        ('main', 'Main Organization'),
        ('sub', 'Sub Organization'),
    )
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    subdomain = models.CharField(max_length=100, unique=True)
    organization_type = models.CharField(max_length=20, choices=ORGANIZATION_TYPES, default='main')
    plan_tier = models.CharField(max_length=50, default='enterprise')
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    
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
        
    @property
    def is_main_organization(self): # <-- ADDED HELPER PROPERTY
        """Helper property to check the organization type."""
        return self.organization_type == 'main'

    class Meta:
        verbose_name = "Organization"
        verbose_name_plural = "Organizations"
        
class OrganizationUser(models.Model):
    ROLE_CHOICES = (
        ("Admin", "Admin"),
        ("HR Manager", "HR Manager"),
        ("Employee", "Employee"),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.email} → {self.organization.name} ({self.role})"
    
from django.db import models
from django.contrib.auth import get_user_model
from .models import Organization

User = get_user_model()


class UserOrganizationAccess(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="org_access")
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="user_access")
    modules = models.JSONField(default=list) # e.g. ['employees', 'attendance']
    def __str__(self):
        return f"{self.user.username} → {self.organization.name}"
    
from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL


class TrainingVideo(models.Model):
    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="training_videos"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    video = models.FileField(upload_to="training_videos/")
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.organization.name})"



# In apps/organizations/models.py (at the bottom)

class TrainingVideoView(models.Model):
    user = models.ForeignKey(  # Changed from 'employee' to 'user'
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='training_video_views'
    )
    video = models.ForeignKey(
        'TrainingVideo',
        on_delete=models.CASCADE,
        related_name='views'
    )
    watched_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'video')
        ordering = ['-watched_at']

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.email} watched {self.video.title}"