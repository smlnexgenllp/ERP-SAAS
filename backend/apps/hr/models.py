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
from django.contrib.auth import get_user_model
from django.db.models import Q
User = get_user_model()

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
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,related_name='employee')
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
import uuid

class JobOpening(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return self.title
class Referral(models.Model):
    STATUS_CHOICES = (
        ("submitted", "Submitted"),
        ("review", "Under Review"),
        ("interview", "Interview Scheduled"),
        ("selected", "Selected"),
        ("rejected", "Rejected"),
        ("joined", "Joined"),
    )
    referral_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    job_opening = models.ForeignKey(JobOpening, on_delete=models.CASCADE)
    referred_by = models.ForeignKey(User, on_delete=models.CASCADE)
    candidate_name = models.CharField(max_length=255)
    candidate_email = models.EmailField()
    candidate_phone = models.CharField(max_length=20)
    resume = models.FileField(upload_to="referrals/", blank=True, null=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="submitted")
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.candidate_name} - {self.referral_id}"

# apps/hr/models.py
class Task(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='tasks')
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')  # ← ADD THIS LINE
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    assigned_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='assigned_tasks')
    assigned_to = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='received_tasks')
    deadline = models.DateField(null=True, blank=True)
    progress_percentage = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        project_name = self.project.name if self.project else "No Project"
        return f"[{project_name}] {self.title} → {self.assigned_to.full_name if self.assigned_to else 'Unassigned'}"

class TaskUpdate(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='updates')
    updated_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True)
    change_description = models.TextField()  # Required: "Completed login page UI"
    old_progress = models.PositiveIntegerField()
    new_progress = models.PositiveIntegerField()
    project = models.ForeignKey('Project', on_delete=models.SET_NULL, null=True, blank=True, related_name='project_updates')
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"Update by {self.updated_by} on {self.task.title}"


class DailyChecklist(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    date = models.DateField()
    for_employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='daily_checklists')
    goals_description = models.TextField()  # Goals set by Manager/TL
    set_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, related_name='set_checklists')

    rating = models.PositiveSmallIntegerField(
        null=True, blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    rated_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True, blank=True, related_name='rated_checklists')
    comments = models.TextField(blank=True)

    class Meta:
        unique_together = ('date', 'for_employee')
        ordering = ['-date']
        verbose_name = "Daily Checklist"
        verbose_name_plural = "Daily Checklists"

    def __str__(self):
        return f"Checklist {self.date} - {self.for_employee.full_name}"

# apps/hr/models.py

class Project(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    
    # Who created the project
    created_by = models.ForeignKey(
        'apps_hr.Employee',  # ← Correct: app_label is 'apps_hr'
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_projects'
    )
    
    # Team members working on this project
    members = models.ManyToManyField(
        'apps_hr.Employee',  # ← Correct reference
        related_name='project_assignments',
        blank=True,
        help_text="Employees assigned to this project — they will see the project chat"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['-start_date']
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'name'],
                name='unique_project_name_per_organization'
            )
        ]

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        # Auto-add creator as member on creation
        if is_new and self.created_by:
            if not self.members.filter(pk=self.created_by.pk).exists():
                self.members.add(self.created_by)
from django.db import models
from django.db.models import Q
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


class ChatGroup(models.Model):

    GROUP_TYPE_ORG = 'organization'
    GROUP_TYPE_PROJECT = 'project'
    GROUP_TYPE_CUSTOM = 'custom'

    GROUP_TYPES = [
        (GROUP_TYPE_ORG, 'Organization'),
        (GROUP_TYPE_PROJECT, 'Project'),
        (GROUP_TYPE_CUSTOM, 'Custom'),
    ]

    name = models.CharField(max_length=255)
    group_type = models.CharField(max_length=20, choices=GROUP_TYPES)

    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE
    )

    project = models.ForeignKey(
        'apps_hr.Project',
        null=True,
        blank=True,
        on_delete=models.CASCADE
    )

    manual_members = models.ManyToManyField(
        User,
        blank=True,
        related_name='custom_chat_groups'
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_chat_groups'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('organization', 'project')
        ordering = ['-created_at']

    def __str__(self):
        if self.group_type == self.GROUP_TYPE_PROJECT and self.project:
            return f"Project: {self.project.name}"
        elif self.group_type == self.GROUP_TYPE_ORG:
            return f"{self.organization.name} - General Chat"
        return self.name

    # ================= MEMBERS =================

    def get_members(self):
        if self.group_type == 'custom':
            return self.manual_members.all()
        elif self.group_type == 'project' and self.project:
            return User.objects.filter(employee__in=self.project.members.all())
        elif self.group_type == 'organization' and self.organization:
            return User.objects.filter(employee__organization=self.organization)
        return User.objects.none()

    def get_member_ids(self):
        return list(self.get_members().values_list('id', flat=True))

    def user_is_member(self, user):
        """Check if the given user is a member of this chat group"""
        if self.group_type == 'custom':
            return self.manual_members.filter(id=user.id).exists()
        elif self.group_type == 'project' and self.project:
            # Employee has OneToOne to User
            return self.project.members.filter(user=user).exists()
        elif self.group_type == 'organization' and self.organization:
            return self.organization.employees.filter(user=user).exists()
        return False


class Message(models.Model):
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_chat_messages')
    content = models.TextField(blank=True)
    file = models.FileField(upload_to='hr/chat/files/%Y/%m/%d/', blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    is_private = models.BooleanField(default=False)
    private_recipients = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='private_chat_messages_received'
    )

    class Meta:
        ordering = ['timestamp']
        indexes = [
            models.Index(fields=['group', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
        # No app_label needed

    def __str__(self):
        return f"{self.sender} → {self.group} ({'Private' if self.is_private else 'Group'})"

    def can_view(self, user):
        """Check if the given user is allowed to see this message"""
        if not self.is_private:
            return True
        return user.id == self.sender_id or self.private_recipients.filter(id=user.id).exists()


class UnreadMessage(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.ForeignKey(Message, on_delete=models.CASCADE)
    group = models.ForeignKey(ChatGroup, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('user', 'message', 'group')
        indexes = [
            models.Index(fields=['user', 'group']),
            models.Index(fields=['group', 'user']),
        ]
        # No app_label needed

    def __str__(self):
        return f"Unread: {self.message} for {self.user}"