from django.db import models
from django.conf import settings
from django.utils import timezone
from apps.crm.models import Customer
from apps.inventory.models import Item
from apps.organizations.models import Organization

class SalesOrder(models.Model):
    ORDER_STATUS = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('processing', 'Processing'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
    ]

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='sales_orders')
    order_number = models.CharField(max_length=50, unique=True)
    order_date = models.DateField(auto_now_add=True)
    expected_delivery_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=ORDER_STATUS, default='draft')
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    gst_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    billing_address = models.TextField(blank=True)
    shipping_address = models.TextField(blank=True)
    payment_terms_days = models.PositiveIntegerField(default=30)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,           # ← this is the correct way
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_sales_orders'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):

        if not self.order_number:
            last = SalesOrder.objects.order_by("-id").first()

            if last:
                number = int(last.order_number.split("-")[-1]) + 1
            else:
                number = 1

            self.order_number = f"SO-{number:05d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.order_number} - {self.customer}"

class SalesOrderItem(models.Model):
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Item, on_delete=models.PROTECT, null=True, blank=True)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.subtotal = self.quantity * self.unit_price - self.discount_amount
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description or self.product} x {self.quantity}"

class Quotation(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('viewed', 'Viewed'),
        ('in_negotiation', 'In Negotiation'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    )

    lead = models.ForeignKey(
        "crm.Contact",
        on_delete=models.CASCADE,
        related_name="quotations",
        help_text="The qualified lead this quotation was created from"
    )

    quote_number = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique quotation number (e.g. QTN-202503-0001)"
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        db_index=True,  # useful for filtering by status
    )

    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    customer_company = models.CharField(max_length=255, blank=True)

    validity_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date until which this quotation is valid"
    )

    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Subtotal before tax"
    )
    gst_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Calculated GST/Tax amount"
    )
    grand_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Final amount including tax"
    )

    notes = models.TextField(blank=True, help_text="Internal notes or special remarks")
    terms = models.TextField(
        blank=True,
        default="1. Prices are valid for 30 days unless otherwise stated.\n"
                "2. Payment terms: 50% advance, balance on delivery.\n"
                "3. Subject to our standard terms and conditions.",
        help_text="Terms and conditions printed on quotation"
    )

    pdf_file = models.FileField(
        upload_to="quotations/%Y/%m/",
        blank=True,
        null=True,
        help_text="Generated PDF version of the quotation"
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_created_quotations",      # ← changed to avoid clash
        related_query_name="sales_quotation_creator",
        help_text="Sales person who created this quotation"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_approved_quotations",     # ← unique name
        related_query_name="sales_quotation_approver",
        help_text="User who approved this quotation (if applicable)"
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Quotation"
        verbose_name_plural = "Quotations"
        indexes = [
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['quote_number']),
        ]

    def __str__(self):
        return f"{self.quote_number} - {self.customer_name}"

    def save(self, *args, **kwargs):
        # Optional: auto-set expired status before save (if needed)
        if self.validity_date and self.validity_date < timezone.now().date():
            if self.status not in ['approved', 'rejected', 'expired']:
                self.status = 'expired'
        super().save(*args, **kwargs)

    def is_expired(self):
        if not self.validity_date:
            return False
        expired = self.validity_date < timezone.now().date()
        if expired and self.status not in ['approved', 'rejected', 'expired']:
            self.status = 'expired'
            self.save(update_fields=['status'])
        return expired

    def mark_as_viewed(self):
        """Optional helper – call when customer opens PDF/email link"""
        if self.status == 'sent':
            self.status = 'viewed'
            self.save(update_fields=['status'])


class FollowUp(models.Model):
    TYPE_CHOICES = (
        ('call', 'Phone Call'),
        ('email', 'Email'),
        ('meeting', 'Meeting'),
        ('whatsapp', 'WhatsApp'),
        ('other', 'Other'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    quotation = models.ForeignKey(
        Quotation,
        on_delete=models.CASCADE,
        related_name="followups"
    )

    followup_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='call'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True
    )

    scheduled_at = models.DateTimeField(
        help_text="When this follow-up is planned"
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this follow-up was actually completed"
    )

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="sales_followups_created",       # ← unique, safe name
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-scheduled_at"]
        verbose_name = "Follow-up"
        verbose_name_plural = "Follow-ups"
        indexes = [
            models.Index(fields=['status', 'scheduled_at']),
        ]

    def __str__(self):
        return f"{self.get_followup_type_display()} – {self.scheduled_at.strftime('%d %b %Y')}"

    def mark_completed(self):
        """Helper method"""
        if self.status == 'pending':
            self.status = 'completed'
            self.completed_at = timezone.now()
            self.save(update_fields=['status', 'completed_at'])
            
from django.db import models

class GSTSettings(models.Model):
    """Single record for organization GST details"""
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    gstin = models.CharField(max_length=15, blank=True, null=True, help_text="e.g. 33XXXXX1234X")
    company_name = models.CharField(max_length=255, blank=True)  # Optional
    address = models.TextField(blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "GST Settings"
        verbose_name_plural = "GST Settings"

    def __str__(self):
        return f"GST Settings (Rate: {self.gst_rate}%)"

    @classmethod
    def get_instance(cls):
        """Get or create the single settings record"""
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
from django.db import models
from django.utils import timezone
from django.conf import settings

# Direct imports (recommended when possible)
from apps.crm.models import Customer
from apps.inventory.models import Item, Dispatch, DispatchItem
from apps.organizations.models import Organization   # ← Note: organizations (plural)


class SalesInvoice(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('issued', 'Issued'),
        ('paid', 'Paid'),
        ('partial', 'Partial Paid'),
        ('cancelled', 'Cancelled'),
    ]

    invoice_number = models.CharField(max_length=50, unique=True, blank=True)

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name='sales_invoices'
    )

    dispatch = models.OneToOneField(
        Dispatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoice'
    )

    invoice_date = models.DateField(default=timezone.now)
    due_date = models.DateField(null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')

    total_taxable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_gst = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    # Correct reference using direct import
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name='sales_invoices'
    )

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date']
        verbose_name = "Sales Invoice"
        verbose_name_plural = "Sales Invoices"
    def update_totals(self):
        totals = self.items.aggregate(
            taxable=models.Sum('taxable_value'),
            gst=models.Sum('gst_amount'),
            total=models.Sum('total_value')
        )

        self.total_taxable = totals['taxable'] or 0
        self.total_gst = totals['gst'] or 0
        self.grand_total = totals['total'] or 0
        self.save()
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            last = SalesInvoice.objects.filter(
                organization=self.organization
            ).order_by('-id').first()

            num = 1 if not last else int(last.invoice_number.split('-')[-1]) + 1

            self.invoice_number = f"INV-{timezone.now().strftime('%Y%m')}-{num:04d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return self.invoice_number


class SalesInvoiceItem(models.Model):
    invoice = models.ForeignKey(SalesInvoice, on_delete=models.CASCADE, related_name='items')

    item = models.ForeignKey(Item, on_delete=models.PROTECT)

    dispatch_item = models.ForeignKey(
        DispatchItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    rate = models.DecimalField(max_digits=12, decimal_places=2)
    taxable_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    gst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    returned_qty = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    @property
    def remaining_qty(self):
        return self.quantity - self.returned_qty
    def save(self, *args, **kwargs):
        self.taxable_value = self.quantity * self.rate
        self.gst_amount = (self.taxable_value * self.gst_rate) / 100
        self.total_value = self.taxable_value + self.gst_amount

        super().save(*args, **kwargs)

        # update invoice totals
        self.invoice.update_totals()


class SalesPayment(models.Model):
    PAYMENT_MODE_CHOICES = [
        ('cash', 'Cash'),
        ('bank', 'Bank Transfer'),
        ('upi', 'UPI'),
        ('cheque', 'Cheque'),
    ]

    invoice = models.ForeignKey(SalesInvoice, on_delete=models.CASCADE, related_name='payments')
    payment_date = models.DateTimeField(auto_now_add=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    mode = models.CharField(max_length=20, choices=PAYMENT_MODE_CHOICES, default='bank')
    reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        invoice = self.invoice

        total_paid = invoice.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or 0

        invoice.amount_paid = total_paid

        if total_paid == 0:
            invoice.status = "issued"
        elif total_paid < invoice.grand_total:
            invoice.status = "partial"
        else:
            invoice.status = "paid"

        invoice.save()
    def __str__(self):
        return f"{self.invoice.invoice_number} - ₹{self.amount}"
class SalesReturn(models.Model):
    invoice = models.ForeignKey('SalesInvoice', on_delete=models.CASCADE)
    customer = models.ForeignKey('crm.Customer', on_delete=models.CASCADE)
    return_date = models.DateField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)


class SalesReturnItem(models.Model):
    sales_return = models.ForeignKey(SalesReturn, on_delete=models.CASCADE, related_name="items")
    item = models.ForeignKey(Item, on_delete=models.PROTECT)
    qty = models.DecimalField(max_digits=10, decimal_places=2)
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=5, decimal_places=2)
    
    