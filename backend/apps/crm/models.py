# apps/crm/models.py
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.organizations.models import Organization  # Adjust import path if needed


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
    
    class Status(models.TextChoices):
        LEAD      = 'lead',      _('Lead')
        CUSTOMER  = 'customer',  _('Customer')
        INACTIVE  = 'inactive',  _('Inactive')
        SUPPLIER  = 'supplier',  _('Supplier')     # optional extra
        PARTNER   = 'partner',   _('Partner')      # optional extra

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.LEAD
    )
    
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
        PROPOSAL      = 'proposal',      _('Proposal Sent')
        NEGOTIATION   = 'negotiation',   _('Negotiation')
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