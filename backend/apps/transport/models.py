# apps/transport/models.py

from decimal import Decimal
from django.db import models
from django.conf import settings
from django.utils import timezone

from apps.organizations.models import Organization
from apps.crm.models import Customer
from apps.inventory.models import Item, Dispatch
from apps.sales.models import SalesOrder
class Vehicle(models.Model):

    VEHICLE_STATUS = [
        ('available', 'Available'),
        ('on_trip', 'On Trip'),
        ('maintenance', 'Maintenance'),
        ('inactive', 'Inactive'),
    ]
    OWNER_TYPE = [
        ('company', 'Company Owned'),
        ('vendor', 'Vendor Vehicle'),
        ('leased', 'Leased Vehicle'),
    ]
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='transport_vehicles'
    )
    vehicle_number = models.CharField(max_length=30, unique=True)
    vehicle_type = models.CharField(max_length=100)
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    capacity_kg = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    capacity_cbm = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    fuel_type = models.CharField(
        max_length=50,
        blank=True
    )
    insurance_expiry = models.DateField(null=True, blank=True)
    permit_expiry = models.DateField(null=True, blank=True)
    pollution_expiry = models.DateField(null=True, blank=True)
    fitness_expiry = models.DateField(null=True, blank=True)
    gps_enabled = models.BooleanField(default=False)
    current_odometer = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    owner_type = models.CharField(
        max_length=20,
        choices=OWNER_TYPE,
        default='company'
    )
    status = models.CharField(
        max_length=20,
        choices=VEHICLE_STATUS,
        default='available'
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transport_vehicles_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['vehicle_number']
    def __str__(self):
        return self.vehicle_number
class Driver(models.Model):
    DRIVER_STATUS = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('on_leave', 'On Leave'),
    ]
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='transport_drivers'
    )
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20)
    alternate_phone = models.CharField(
        max_length=20,
        blank=True
    )
    address = models.TextField(blank=True)
    license_number = models.CharField(max_length=100)
    license_expiry = models.DateField()
    blood_group = models.CharField(
        max_length=10,
        blank=True
    )
    joining_date = models.DateField(
        default=timezone.localdate
    )
    salary = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )
    salary_type = models.CharField(
        max_length=50,
        default='monthly'
    )
    status = models.CharField(
        max_length=20,
        choices=DRIVER_STATUS,
        default='active'
    )
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transport_drivers_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        ordering = ['full_name']

    def __str__(self):
        return self.full_name
class TransportRoute(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='transport_routes'
    )

    route_code = models.CharField(
        max_length=50,
        unique=True
    )

    source_location = models.CharField(max_length=255)

    destination_location = models.CharField(max_length=255)

    distance_km = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    expected_hours = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    toll_estimate = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['route_code']

    def __str__(self):
        return f"{self.source_location} → {self.destination_location}"


# =========================================================
# TRANSPORT TRIP
# =========================================================

class TransportTrip(models.Model):

    TRIP_STATUS = [
        ('planned', 'Planned'),
        ('loading', 'Loading'),
        ('in_transit', 'In Transit'),
        ('reached', 'Reached'),
        ('unloading', 'Unloading'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='transport_trips'
    )

    trip_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True
    )

    sales_order = models.ForeignKey(
        SalesOrder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transport_trips'
    )

    dispatch = models.ForeignKey(
        Dispatch,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transport_trips'
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transport_trips'
    )

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.PROTECT,
        related_name='trips'
    )

    driver = models.ForeignKey(
        Driver,
        on_delete=models.PROTECT,
        related_name='trips'
    )

    route = models.ForeignKey(
        TransportRoute,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='trips'
    )

    trip_date = models.DateField(default=timezone.now)

    loading_time = models.DateTimeField(
        null=True,
        blank=True
    )

    departure_time = models.DateTimeField(
        null=True,
        blank=True
    )

    expected_arrival = models.DateTimeField(
        null=True,
        blank=True
    )

    actual_arrival = models.DateTimeField(
        null=True,
        blank=True
    )

    starting_km = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    ending_km = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    total_distance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    fuel_used = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    trip_status = models.CharField(
        max_length=20,
        choices=TRIP_STATUS,
        default='planned'
    )

    remarks = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transport_trips_created'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):

        if not self.trip_number:

            last = TransportTrip.objects.filter(
                organization=self.organization
            ).order_by('-id').first()

            if last and last.trip_number:
                try:
                    num = int(last.trip_number.split('-')[-1]) + 1
                except:
                    num = 1
            else:
                num = 1

            self.trip_number = f"TRIP-{num:05d}"

        if self.starting_km and self.ending_km:
            self.total_distance = (
                self.ending_km - self.starting_km
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return self.trip_number


# =========================================================
# TRIP ITEMS
# =========================================================

class TransportTripItem(models.Model):

    trip = models.ForeignKey(
        TransportTrip,
        on_delete=models.CASCADE,
        related_name='items'
    )

    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT
    )

    dispatch_qty = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    loaded_qty = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    delivered_qty = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    damaged_qty = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    remarks = models.TextField(blank=True)

    def __str__(self):
        return f"{self.trip.trip_number} - {self.item}"


# =========================================================
# DELIVERY PROOF (POD)
# =========================================================

class DeliveryProof(models.Model):

    DELIVERY_STATUS = [
        ('pending', 'Pending'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('partial', 'Partial Delivered'),
    ]

    trip = models.OneToOneField(
        TransportTrip,
        on_delete=models.CASCADE,
        related_name='delivery_proof'
    )

    customer_name = models.CharField(max_length=255)

    received_by = models.CharField(max_length=255)

    received_phone = models.CharField(
        max_length=20,
        blank=True
    )

    delivery_time = models.DateTimeField(
        default=timezone.now
    )

    delivery_status = models.CharField(
        max_length=20,
        choices=DELIVERY_STATUS,
        default='pending'
    )

    otp_verified = models.BooleanField(default=False)

    signature = models.ImageField(
        upload_to='transport/signatures/',
        null=True,
        blank=True
    )

    photo = models.ImageField(
        upload_to='transport/pod/',
        null=True,
        blank=True
    )

    delivery_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.trip.trip_number} POD"


# =========================================================
# FUEL ENTRY
# =========================================================

class FuelEntry(models.Model):

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='fuel_entries'
    )

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name='fuel_entries'
    )

    trip = models.ForeignKey(
        TransportTrip,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fuel_entries'
    )

    fuel_date = models.DateField(default=timezone.now)

    liters = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    rate_per_liter = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    fuel_station = models.CharField(
        max_length=255,
        blank=True
    )

    odometer_reading = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        self.amount = (
            self.liters * self.rate_per_liter
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.vehicle} - {self.fuel_date}"


# =========================================================
# VEHICLE MAINTENANCE
# =========================================================

class VehicleMaintenance(models.Model):

    MAINTENANCE_STATUS = [
        ('scheduled', 'Scheduled'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='vehicle_maintenance'
    )

    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name='maintenance_records'
    )

    maintenance_type = models.CharField(max_length=255)

    service_center = models.CharField(
        max_length=255,
        blank=True
    )

    service_date = models.DateField()

    next_service_date = models.DateField(
        null=True,
        blank=True
    )

    cost = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    odometer_reading = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=20,
        choices=MAINTENANCE_STATUS,
        default='scheduled'
    )

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vehicle} - {self.maintenance_type}"


# =========================================================
# TRANSPORT EXPENSES
# =========================================================

class TransportExpense(models.Model):

    EXPENSE_TYPES = [
        ('fuel', 'Fuel'),
        ('toll', 'Toll'),
        ('driver_bata', 'Driver Bata'),
        ('loading', 'Loading'),
        ('unloading', 'Unloading'),
        ('repair', 'Repair'),
        ('parking', 'Parking'),
        ('penalty', 'Penalty'),
        ('other', 'Other'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='transport_expenses'
    )

    trip = models.ForeignKey(
        TransportTrip,
        on_delete=models.CASCADE,
        related_name='expenses'
    )

    expense_type = models.CharField(
        max_length=50,
        choices=EXPENSE_TYPES
    )

    expense_date = models.DateField(
        default=timezone.now
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    reference_number = models.CharField(
        max_length=100,
        blank=True
    )

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.trip.trip_number} - {self.expense_type}"


# =========================================================
# TRANSPORT INVOICE
# =========================================================

class TransportInvoice(models.Model):

    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('partial', 'Partial'),
        ('paid', 'Paid'),
    ]

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        related_name='transport_invoices'
    )

    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        blank=True
    )

    customer = models.ForeignKey(
        Customer,
        on_delete=models.PROTECT,
        related_name='transport_invoices'
    )

    trip = models.ForeignKey(
        TransportTrip,
        on_delete=models.CASCADE,
        related_name='transport_invoices'
    )

    invoice_date = models.DateField(
        default=timezone.now
    )

    taxable_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    gst_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=18
    )

    gst_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    grand_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    amount_paid = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS,
        default='pending'
    )

    due_date = models.DateField(
        null=True,
        blank=True
    )

    notes = models.TextField(blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):

        if not self.invoice_number:

            last = TransportInvoice.objects.filter(
                organization=self.organization
            ).order_by('-id').first()

            if last and last.invoice_number:
                try:
                    num = int(last.invoice_number.split('-')[-1]) + 1
                except:
                    num = 1
            else:
                num = 1

            self.invoice_number = f"TINV-{num:05d}"

        self.gst_amount = (
            self.taxable_amount * self.gst_percentage
        ) / Decimal('100')

        self.grand_total = (
            self.taxable_amount + self.gst_amount
        )

        if self.amount_paid <= 0:
            self.payment_status = 'pending'
        elif self.amount_paid < self.grand_total:
            self.payment_status = 'partial'
        else:
            self.payment_status = 'paid'

        super().save(*args, **kwargs)

    def __str__(self):
        return self.invoice_number