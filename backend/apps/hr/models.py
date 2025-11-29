import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class Organization(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ERPModule(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)


class OrganizationModule(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    module = models.ForeignKey(ERPModule, on_delete=models.CASCADE)
    enabled = models.BooleanField(default=True)


class OrganizationUser(models.Model):

    ROLE_CHOICES = [
        ("admin", "Admin"),
        ("hr_manager", "HR Manager"),
        ("employee", "Employee"),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    manager = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="subordinates",
        on_delete=models.SET_NULL
    )


class EmployeeDocument(models.Model):
    user = models.ForeignKey(OrganizationUser, on_delete=models.CASCADE)
    file = models.FileField(upload_to="employee_docs/")
    doc_type = models.CharField(max_length=100)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Invitation(models.Model):
    email = models.EmailField()
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    role = models.CharField(max_length=20, default="employee")
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    accepted = models.BooleanField(default=False)
    expires_at = models.DateTimeField()

    invited_by = models.ForeignKey(
        OrganizationUser, on_delete=models.SET_NULL, null=True
    )
from datetime import datetime, timedelta

def get_expiry_time():
    return datetime.now() + timedelta(days=7)
