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
from django.core.validators import MinValueValidator, MaxValueValidator
import uuid
from datetime import date  # <-- Add this line!


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

class Invoice(models.Model):
    """
    Payroll Invoice model for monthly salary invoices
    """
    INVOICE_STATUS = [
        ('DRAFT', 'Draft'),
        ('GENERATED', 'Generated'),
        ('PENDING', 'Pending Payment'),
        ('PAID', 'Paid'),
        ('CANCELLED', 'Cancelled')
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    invoice_number = models.CharField(max_length=50, unique=True)
    employee = models.ForeignKey('Employee', on_delete=models.CASCADE, related_name='invoices')
    
    # Invoice period
    month = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(12)])
    year = models.IntegerField()
    
    # Salary components
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    medical_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    conveyance_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Deductions
    professional_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    income_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ESI contributions
    esi_employee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    esi_employer_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # PF contributions
    pf_employee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pf_employer_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pf_voluntary_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Totals
    total_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Status and dates
    status = models.CharField(max_length=20, choices=INVOICE_STATUS, default='DRAFT')
    generated_date = models.DateTimeField(auto_now_add=True)
    paid_date = models.DateTimeField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    
    # Payment info
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Notes
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-year', '-month', 'employee__full_name']
        unique_together = ['employee', 'month', 'year']
        verbose_name = 'Payroll Invoice'
        verbose_name_plural = 'Payroll Invoices'
    
    def __str__(self):
        return f"Invoice #{self.invoice_number} - {self.employee.full_name} ({self.month}/{self.year})"
    
    def save(self, *args, **kwargs):
        # Generate invoice number if not set
        if not self.invoice_number:
            self.invoice_number = self.generate_invoice_number()
        super().save(*args, **kwargs)
    
    def generate_invoice_number(self):
        """Generate unique invoice number"""
        return f"INV-{self.year}-{self.month:02d}-{str(self.id)[:8].upper()}"
    
    def get_month_name(self):
        """Get month name from month number"""
        from datetime import datetime
        return datetime.strptime(str(self.month), "%m").strftime("%B")        

# Add to apps/hr/models.py (if not already there)
class Salary(models.Model):
    """
    Employee salary configuration
    """
    employee = models.OneToOneField('Employee', on_delete=models.CASCADE, related_name='salary_info')
    
    # Basic Salary
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Allowances
    hra = models.DecimalField(max_digits=12, decimal_places=2, default=0, verbose_name="House Rent Allowance")
    medical_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    conveyance_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Deductions
    professional_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    income_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # ESI Settings
    has_esi = models.BooleanField(default=False, verbose_name="Has ESI")
    esi_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="ESI Number")
    esi_employee_share_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0.75,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Employee ESI contribution percentage"
    )
    esi_employer_share_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=3.25,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Employer ESI contribution percentage"
    )
    
    # PF Settings
    has_pf = models.BooleanField(default=False, verbose_name="Has PF")
    pf_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="PF Number")
    uan_number = models.CharField(max_length=20, blank=True, null=True, verbose_name="UAN Number")
    pf_employee_share_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=12,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Employee PF contribution percentage"
    )
    pf_employer_share_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=13,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Employer PF contribution percentage"
    )
    pf_voluntary_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Voluntary PF contribution percentage"
    )
    
    # Calculated fields (these will be calculated on save)
    total_allowances = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Calculated contributions
    esi_employee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    esi_employer_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pf_employee_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pf_employer_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pf_voluntary_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Additional info
    effective_date = models.DateField(
        null=False,           # Keep null=False
        blank=False,
        default=date.today    # Automatically set to today if not provided
    )
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = "Salaries"
        ordering = ['-effective_date']
    
    def calculate_totals(self):
        """Calculate all totals and contributions"""
        # Calculate allowances
        self.total_allowances = (
            self.hra +
            self.medical_allowance +
            self.conveyance_allowance +
            self.special_allowance +
            self.other_allowances
        )
        
        # Calculate gross salary
        self.gross_salary = self.basic_salary + self.total_allowances
        
        # Calculate ESI (if applicable and salary <= 21000)
        if self.has_esi and self.gross_salary <= 21000:
            self.esi_employee_amount = (self.gross_salary * self.esi_employee_share_percentage) / 100
            self.esi_employer_amount = (self.gross_salary * self.esi_employer_share_percentage) / 100
        else:
            self.esi_employee_amount = 0
            self.esi_employer_amount = 0
        
        # Calculate PF (on basic salary, max 15000)
        if self.has_pf:
            pf_wage_limit = 15000
            pf_applicable_salary = min(self.basic_salary, pf_wage_limit)
            
            self.pf_employee_amount = (pf_applicable_salary * self.pf_employee_share_percentage) / 100
            self.pf_employer_amount = (pf_applicable_salary * self.pf_employer_share_percentage) / 100
            
            # Voluntary PF on remaining amount
            if self.pf_voluntary_percentage > 0:
                voluntary_amount = ((self.basic_salary - pf_applicable_salary) * self.pf_voluntary_percentage) / 100
                self.pf_voluntary_amount = max(voluntary_amount, 0)
        else:
            self.pf_employee_amount = 0
            self.pf_employer_amount = 0
            self.pf_voluntary_amount = 0
        
        # Calculate total deductions
        self.total_deductions = (
            self.professional_tax +
            self.income_tax +
            self.other_deductions +
            self.esi_employee_amount +
            self.pf_employee_amount +
            self.pf_voluntary_amount
        )
        
        # Calculate net salary
        self.net_salary = self.gross_salary - self.total_deductions
    
    def save(self, *args, **kwargs):
        self.calculate_totals()
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.employee.full_name} - Salary"