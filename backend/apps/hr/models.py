# apps/hr/models.py

from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
from apps.organizations.models import Organization

phone_validator = RegexValidator(r"^\+?1?\d{9,15}$", "Enter a valid phone number.")


class Department(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="departments")
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ("organization", "code")
        ordering = ["name"]

    def __str__(self):
        return self.name


class Designation(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="designations")
    title = models.CharField(max_length=150)
    grade = models.CharField(max_length=50, blank=True)

    class Meta:
        unique_together = ("organization", "title")

    def __str__(self):
        return self.title


ROLE_CHOICES = [
    ("admin", "Admin"),
    ("hr", "HR"),
    ("employee", "Employee"),
]


class Employee(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="employees")
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    full_name = models.CharField(max_length=200)
    employee_code = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=20, validators=[phone_validator], blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="employee")

    reporting_to = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="subordinates")

    # Use direct class reference — Django will resolve it correctly now
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True)

    date_of_joining = models.DateField(null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    is_probation = models.BooleanField(default=False)
    ctc = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    photo = models.ImageField(upload_to='hr/photos/', null=True, blank=True)
    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("organization", "employee_code")
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.employee_code})" if self.employee_code else self.full_name