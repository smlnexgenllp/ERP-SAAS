# apps/hr/models.py
from django.db import models
from django.conf import settings
from django.core.validators import RegexValidator
from apps.organizations.models import Organization
# Email sending imports
from django.contrib.sites.shortcuts import get_current_site
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.template.loader import render_to_string
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

    # ← THIS METHOD MUST BE INDENTED INSIDE THE CLASS!
    def send_invitation_email(self, request=None):
        if not self.user:
            return  # or raise error

        email = self.user.email or self.email
        if not email:
            return

        current_site = get_current_site(request)
        domain = current_site.domain if current_site else 'localhost:3000'

        context = {
            'full_name': self.full_name,
            'employee_code': self.employee_code or 'N/A',
            'organization': self.organization.name if self.organization else 'Our Company',
            'domain': domain,
            'uid': urlsafe_base64_encode(force_bytes(self.user.pk)),
            'token': default_token_generator.make_token(self.user),
            'protocol': 'https' if request and request.is_secure() else 'http',
        }

        subject = f"Welcome to {context['organization']} – Set Your Password"
        html_message = render_to_string('emails/invitation_email.html', context)

        send_mail(
            subject=subject,
            message='',
            html_message=html_message,
            from_email=None,
            recipient_list=[email],
            fail_silently=False,
        )


class EmployeeDocument(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    file = models.FileField(upload_to='hr/documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.title} - {self.employee.full_name}"

import uuid

class EmployeeInvite(models.Model):
    full_name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="employee")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    designation = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True, blank=True)
    date_of_joining = models.DateField(null=True, blank=True)
    is_probation = models.BooleanField(default=False)
    ctc = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    notes = models.TextField(blank=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, null=True, blank=True)
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_accepted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.full_name} <{self.email}>"
