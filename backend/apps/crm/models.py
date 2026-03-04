# apps/crm/models.py
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone

from apps.organizations.models import Organization  # Adjust import path if needed


class Product(models.Model):
    """
    Represents a product or service for sale.
    """
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='products'
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit = models.CharField(max_length=50, blank=True)  # e.g., 'piece', 'hour'
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        verbose_name = _('Product')
        verbose_name_plural = _('Products')

    def __str__(self):
        return self.name


class Contact(models.Model):
    """
    Represents a person or business contact (leads, customers, partners, etc.)
    """
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='contacts'
    )
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100, blank=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True)
    mobile = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=200, blank=True)
    position = models.CharField(max_length=100, blank=True)

    LEAD_STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),  # Updated to match flow
        ('interested', 'Interested'),
        ('follow_up', 'Follow Up'),
        ('won', 'Won'),
        ('lost', 'Lost'),
        ('customer', 'Customer'),
    ]

    status = models.CharField(
        max_length=20,
        choices=LEAD_STATUS_CHOICES,
        default='new'
    )

    next_follow_up = models.DateTimeField(null=True, blank=True)
    
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_contacts'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Contact')
        verbose_name_plural = _('Contacts')
        indexes = [
            models.Index(fields=['organization', 'status']),
            models.Index(fields=['email']),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name or ''}".strip() or self.email or _("Unnamed Contact")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name or ''}".strip()


class Opportunity(models.Model):
    """
    Sales opportunities / deals / pipelines
    """
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='opportunities'
    )
    
    title = models.CharField(max_length=200)
    value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    
    class Stage(models.TextChoices):
        NEW           = 'new',           _('New')
        CONTACTED     = 'contacted',     _('Contacted')
        QUALIFIED     = 'qualified',     _('Qualified')
        QUOTATION_SENT = 'quotation_sent', _('Quotation Sent')  # Added for flow
        NEGOTIATION   = 'negotiation',   _('Negotiation')
        SALES_ORDER   = 'sales_order',   _('Sales Order')  # Added
        INVOICED      = 'invoiced',      _('Invoiced')  # Added
        WON           = 'won',           _('Won')
        LOST          = 'lost',          _('Lost')
        ON_HOLD       = 'on_hold',       _('On Hold')

    stage = models.CharField(
        max_length=50,
        choices=Stage.choices,
        default=Stage.NEW
    )
    
    probability = models.PositiveSmallIntegerField(default=10, help_text="Estimated success probability %")
    expected_close_date = models.DateField(null=True, blank=True)
    actual_close_date = models.DateField(null=True, blank=True)
    
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_opportunities'
    )

    class Meta:
        ordering = ['-created_at']
        verbose_name = _('Opportunity')
        verbose_name_plural = _('Opportunities')
        indexes = [
            models.Index(fields=['contact', 'stage']),
            models.Index(fields=['stage', 'expected_close_date']),
        ]

    def __str__(self):
        return f"{self.title} ({self.contact})"

    @property
    def is_won(self):
        return self.stage == self.Stage.WON

    @property
    def is_lost(self):
        return self.stage == self.Stage.LOST

    @property
    def is_open(self):
        return self.stage not in (self.Stage.WON, self.Stage.LOST)


class Activity(models.Model):
    """
    Tracks activities like calls, emails, meetings for opportunities.
    """
    opportunity = models.ForeignKey(
        Opportunity,
        on_delete=models.CASCADE,
        related_name='activities'
    )
    type = models.CharField(
        max_length=50,
        choices=[
            ('call', 'Call'),
            ('email', 'Email'),
            ('meeting', 'Meeting'),
            ('note', 'Note'),
            ('task', 'Task'),
        ]
    )
    date = models.DateTimeField(default=timezone.now)
    duration_minutes = models.PositiveIntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_activities'
    )

    class Meta:
        ordering = ['-date']
        verbose_name = _('Activity')
        verbose_name_plural = _('Activities')

    def __str__(self):
        return f"{self.type} for {self.opportunity}"


class CallLog(models.Model):
    contact = models.ForeignKey(
        Contact,
        on_delete=models.CASCADE,
        related_name='call_logs'
    )
    called_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    call_time = models.DateTimeField(auto_now_add=True)
    duration_seconds = models.IntegerField(null=True, blank=True)

    CALL_RESULT_CHOICES = [
        ('connected', 'Connected'),
        ('no_answer', 'No Answer'),
        ('busy', 'Busy'),
        ('interested', 'Interested'),
        ('not_interested', 'Not Interested'),
        ('callback', 'Call Back Later'),
    ]

    result = models.CharField(max_length=30, choices=CALL_RESULT_CHOICES)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-call_time']


class Customer(models.Model):
    """
    Represents a converted paying customer.
    Can link back to original Contact for history.
    """
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='customers'
    )
    contact = models.OneToOneField(
        Contact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_profile'
    )
    full_name = models.CharField(max_length=200)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=200, blank=True)
    
    customer_since = models.DateField(auto_now_add=True)
    status = models.CharField(
        max_length=30,
        choices=[
            ('active', 'Active'),
            ('inactive', 'Inactive'),
            ('churned', 'Churned'),
        ],
        default='active'
    )
    
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_customers'
    )
    
    class Meta:
        ordering = ['-customer_since']
    
    def __str__(self):
        return self.full_name or self.email or "Unnamed Customer"


class Quotation(models.Model):
    """
    Quotation sent to the customer.
    """
    opportunity = models.ForeignKey(
        Opportunity,
        on_delete=models.CASCADE,
        related_name='quotations'
    )
    number = models.CharField(max_length=50, unique=True)
    date = models.DateField(default=timezone.now)
    expiry_date = models.DateField(null=True, blank=True)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    terms = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('sent', 'Sent'),
            ('accepted', 'Accepted'),
            ('rejected', 'Rejected'),
            ('expired', 'Expired'),
        ],
        default='draft'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_quotations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        verbose_name = _('Quotation')
        verbose_name_plural = _('Quotations')

    def __str__(self):
        return self.number

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = f"QT-{timezone.now().strftime('%Y%m%d')}-{Quotation.objects.count() + 1}"
        super().save(*args, **kwargs)


class QuotationItem(models.Model):
    quotation = models.ForeignKey(
        Quotation,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        related_name='quotation_items'
    )
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.price
        super().save(*args, **kwargs)


class SalesOrder(models.Model):
    """
    Sales order confirmed from quotation.
    """
    quotation = models.OneToOneField(
        Quotation,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sales_order'
    )
    opportunity = models.ForeignKey(
        Opportunity,
        on_delete=models.CASCADE,
        related_name='sales_orders'
    )
    number = models.CharField(max_length=50, unique=True)
    date = models.DateField(default=timezone.now)
    delivery_date = models.DateField(null=True, blank=True)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    terms = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('confirmed', 'Confirmed'),
            ('shipped', 'Shipped'),
            ('delivered', 'Delivered'),
            ('cancelled', 'Cancelled'),
        ],
        default='draft'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_sales_orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        verbose_name = _('Sales Order')
        verbose_name_plural = _('Sales Orders')

    def __str__(self):
        return self.number

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = f"SO-{timezone.now().strftime('%Y%m%d')}-{SalesOrder.objects.count() + 1}"
        super().save(*args, **kwargs)


class SalesOrderItem(models.Model):
    sales_order = models.ForeignKey(
        SalesOrder,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        related_name='sales_order_items'
    )
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.price
        super().save(*args, **kwargs)


class Invoice(models.Model):
    """
    Invoice generated from sales order.
    """
    sales_order = models.OneToOneField(
        SalesOrder,
        on_delete=models.SET_NULL,
        null=True,
        related_name='invoice'
    )
    number = models.CharField(max_length=50, unique=True)
    date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)
    total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    terms = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ('draft', 'Draft'),
            ('sent', 'Sent'),
            ('paid', 'Paid'),
            ('partial', 'Partial'),
            ('overdue', 'Overdue'),
            ('cancelled', 'Cancelled'),
        ],
        default='draft'
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_invoices'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']
        verbose_name = _('Invoice')
        verbose_name_plural = _('Invoices')

    def __str__(self):
        return self.number

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = f"INV-{timezone.now().strftime('%Y%m%d')}-{Invoice.objects.count() + 1}"
        self.balance = self.grand_total - self.amount_paid
        super().save(*args, **kwargs)


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        related_name='invoice_items'
    )
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.price
        super().save(*args, **kwargs)


class Payment(models.Model):
    """
    Payment received for invoice.
    """
    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name='payments'
    )
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    date = models.DateField(default=timezone.now)
    method = models.CharField(
        max_length=50,
        choices=[
            ('cash', 'Cash'),
            ('bank_transfer', 'Bank Transfer'),
            ('credit_card', 'Credit Card'),
            ('paypal', 'PayPal'),
            ('other', 'Other'),
        ]
    )
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_payments'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-date']
        verbose_name = _('Payment')
        verbose_name_plural = _('Payments')

    def __str__(self):
        return f"Payment {self.amount} for {self.invoice}"


