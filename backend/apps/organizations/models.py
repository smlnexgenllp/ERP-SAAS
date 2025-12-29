# In apps/organizations/models.py
from django.db import models
from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model
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
    def is_main_organization(self):
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

class UserOrganizationAccess(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="org_access")
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="user_access")
    modules = models.JSONField(default=list) 
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
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='training_video_views',
        help_text="The organization this view record belongs to",
        blank=True,
        null=True,
    )
    user = models.ForeignKey(  
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='training_video_views'
    )
    video = models.ForeignKey(
        'TrainingVideo',
        on_delete=models.CASCADE,
        related_name='views'
    )
    progress = models.PositiveSmallIntegerField(default=0)
    watched_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'video')
        ordering = ['-watched_at']

    def __str__(self): 
        return f"{self.user.get_full_name() or self.user.email} watched {self.video.title}"
# apps/training/models.py

from django.db import models
from django.conf import settings
from apps.organizations.models import Organization

User = settings.AUTH_USER_MODEL

class TrainingCompletion(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)  
    class Meta:
        unique_together = ('user', 'organization')

    def __str__(self):
        return f"{self.user} - Training {'Completed' if self.completed else 'Pending'}"
# apps/organizations/models.py (add at the bottom)

from django.db import models
 # if in same file, or import accordingly

class OrganizationBranding(models.Model):
    """
    Separate branding settings for offer letters and emails
    """
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name='branding'
    )
    logo = models.ImageField(upload_to='org_logos/', null=True, blank=True)
    hr_email = models.EmailField(blank=True, help_text="Default FROM email for offer letters")
    hr_contact_name = models.CharField(max_length=100, blank=True, default="HR Team")
    website = models.URLField(blank=True)
    tagline = models.CharField(max_length=255, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Branding for {self.organization.name}"

    class Meta:
        verbose_name = "Organization Branding"
        verbose_name_plural = "Organization Branding"