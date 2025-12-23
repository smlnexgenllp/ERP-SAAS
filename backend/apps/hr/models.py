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
    is_logged_in = models.BooleanField(default=False)
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

User = settings.AUTH_USER_MODEL
class LeaveRequest(models.Model):
    LEAVE_TYPES = (
        ('sick', 'Sick Leave'),
        ('casual', 'Casual Leave'),
        ('earned', 'Earned Leave'),
        ('wfh', 'Work From Home'),
    )
    STATUS = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="leave_requests",null=True, blank=True)
    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField(blank=True)
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='leave_approvals')
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    response_note = models.TextField(blank=True)

    class Meta:
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.employee} - {self.leave_type} ({self.start_date} → {self.end_date})"


class PermissionRequest(models.Model):
    STATUS = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    )
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="permission_requests",null=True, blank=True)
    employee=models.ForeignKey(User,on_delete=models.CASCADE)
    date = models.DateField()
    time_from = models.TimeField()
    time_to = models.TimeField()
    reason = models.TextField(blank=True)
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='permission_approvals')
    status = models.CharField(max_length=20, choices=STATUS, default='pending')
    applied_at = models.DateTimeField(auto_now_add=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    response_note = models.TextField(blank=True)

    class Meta:
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.employee} permission on {self.date} ({self.time_from}-{self.time_to})"

class EmployeeReimbursement(models.Model):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    STATUS_CHOICES = [
        (PENDING, "Pending"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name="reimbursements",null=True, blank=True)
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name="reimbursements")
    manager = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="reimbursements_to_approve")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.employee.full_name} - {self.amount} ({self.status})"
    
class Attendance(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE
    )

    date = models.DateField()
    punch_in = models.DateTimeField(null=True, blank=True)
    punch_out = models.DateTimeField(null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=[
            ("PRESENT", "Present"),
            ("LATE", "Late"),
            ("LEAVE", "Leave"),
            ("PENDING", "Pending Approval"),
        ],
        default="PENDING"
    )

    is_late = models.BooleanField(default=False)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_attendance"
    )

    class Meta:
        unique_together = ("employee", "organization", "date")

class LatePunchRequest(models.Model):
    attendance = models.OneToOneField(
        Attendance,
        on_delete=models.CASCADE,
        related_name="late_request",
        blank=True, null=True
    )
    reason = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("PENDING", "Pending"),
            ("APPROVED", "Approved"),
            ("REJECTED", "Rejected"),
        ],
        default="PENDING"
    )
    
    requested_at = models.DateTimeField(auto_now_add=True,blank=True, null=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_late_requests"
    )
    approved_at = models.DateTimeField(null=True, blank=True)


