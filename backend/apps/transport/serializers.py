# apps/transport/serializers.py

from rest_framework import serializers

from .models import (
    Vehicle,
    Driver,
    TransportRoute,
    TransportTrip,
    TransportTripItem,
    DeliveryProof,
    FuelEntry,
    VehicleMaintenance,
    TransportExpense,
    TransportInvoice,
)

from apps.sales.models import SalesOrder
# =========================================================
# VEHICLE
# =========================================================

class VehicleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Vehicle
        fields = "__all__"
        extra_kwargs = {
            "organization": {"required": False},
        }

    def create(self, validated_data):

        request = self.context.get("request")

        if request and request.user.is_authenticated:

            # adjust based on your user model
            validated_data["organization"] = request.user.organization

        return super().create(validated_data)


# =========================================================
# DRIVER
# =========================================================

class DriverSerializer(serializers.ModelSerializer):

    class Meta:
        model = Driver
        fields = "__all__"
        extra_kwargs = {
            "organization": {"required": False},
        }

    def create(self, validated_data):

        request = self.context.get("request")

        if request and request.user.is_authenticated:
            validated_data["organization"] = request.user.organization

        return super().create(validated_data)


# =========================================================
# ROUTE
# =========================================================

class TransportRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportRoute
        fields = [
            'id', 'route_code', 'source_location', 'destination_location',
            'distance_km', 'expected_hours', 'toll_estimate', 'notes', 'created_at'
        ]
        read_only_fields = ['route_code', 'created_at', 'organization']


# =========================================================
# TRIP ITEM
# =========================================================

class TransportTripItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = TransportTripItem
        fields = [
            'id', 'sales_order_item', 'item', 'item_name', 'description',
            'ordered_qty', 'dispatch_qty', 'loaded_qty', 
            'delivered_qty', 'damaged_qty', 'short_qty', 'remarks'
        ]
        read_only_fields = ['short_qty']

# =========================================================
# TRANSPORT TRIP
# =========================================================

class TransportTripSerializer(serializers.ModelSerializer):
    # Nested Items (if you want to show items in list - optional but heavy)
    items = TransportTripItemSerializer(many=True, required=False, read_only=True)

    # Important Display Fields (Read Only)
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    driver_name = serializers.CharField(source='driver.full_name', read_only=True)
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    sales_order_number = serializers.CharField(source='sales_order.order_number', read_only=True)

    # Timing Fields
    loading_start_time = serializers.DateTimeField(read_only=True)
    departure_time = serializers.DateTimeField(read_only=True)
    expected_arrival = serializers.DateTimeField(read_only=True)

    class Meta:
        model = TransportTrip
        fields = [
            # Basic Info
            'id',
            'trip_number',
            'trip_date',
            'trip_type',
            'trip_status',

            # Relationships (IDs)
            'sales_order',
            'customer',
            'vehicle',
            'driver',
            'route',

            # Display Names (Very Important for List)
            'sales_order_number',
            'customer_name',
            'vehicle_number',
            'driver_name',

            # Other Fields
            'starting_km',
            'fuel_used',
            'remarks',

            # Timing Fields
            'loading_start_time',
            'loading_end_time',
            'departure_time',
            'expected_arrival',
            'actual_arrival',
            'unloading_start_time',
            'unloading_end_time',

            # Items
            'items',
        ]

        read_only_fields = [
            'trip_number',
            'total_distance',
            'fuel_efficiency',
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        trip = super().create(validated_data)   # This triggers perform_create
        
        for item_data in items_data:
            TransportTripItem.objects.create(trip=trip, **item_data)
        
        return trip


# =========================================================
# DELIVERY PROOF
# =========================================================

class DeliveryProofSerializer(serializers.ModelSerializer):

    class Meta:
        model = DeliveryProof
        fields = "__all__"


# =========================================================
# FUEL ENTRY
# =========================================================

class FuelEntrySerializer(serializers.ModelSerializer):

    vehicle_name = serializers.CharField(
        source="vehicle.vehicle_number",
        read_only=True
    )

    class Meta:
        model = FuelEntry
        fields = "__all__"
        extra_kwargs = {
            "organization": {"required": False},
        }

    def create(self, validated_data):

        request = self.context.get("request")

        if request and request.user.is_authenticated:
            validated_data["organization"] = request.user.organization

        return super().create(validated_data)


class VehicleMaintenanceSerializer(serializers.ModelSerializer):
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = VehicleMaintenance
        fields = [
            'id',
            'organization',
            'vehicle',
            'vehicle_number',
            'maintenance_type',
            'service_center',
            'service_date',
            'next_service_date',
            'cost',
            'odometer_reading',
            'status',
            'notes',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'vehicle_number', 'organization']
        # Added 'organization' to read_only_fields ↑


class VehicleMaintenanceListSerializer(serializers.ModelSerializer):
    """Used for listing with less data"""
    vehicle_number = serializers.CharField(source='vehicle.vehicle_number', read_only=True)

    class Meta:
        model = VehicleMaintenance
        fields = [
            'id', 'vehicle_number', 'maintenance_type', 'service_date',
            'next_service_date', 'status', 'cost', 'odometer_reading'
        ]
class VehicleDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = ['id', 'vehicle_number', 'brand', 'model', 'status']
# =========================================================
# TRANSPORT EXPENSE
# =========================================================

class TransportExpenseSerializer(serializers.ModelSerializer):
    expense_type_display = serializers.CharField(source='get_expense_type_display', read_only=True)
    trip_number = serializers.CharField(source='trip.trip_number', read_only=True)
    vehicle_number = serializers.CharField(source='trip.vehicle.vehicle_number', read_only=True)
    driver_name = serializers.CharField(source='trip.driver.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = TransportExpense
        fields = [
            'id',
            'trip',
            'trip_number',
            'vehicle_number',
            'driver_name',
            'expense_type',
            'expense_type_display',
            'expense_date',
            'amount',
            'reference_number',
            'notes',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['organization', 'created_by', 'created_at', 'updated_at']


# =========================================================
# TRANSPORT INVOICE
# =========================================================

class TransportInvoiceSerializer(serializers.ModelSerializer):
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)
    trip_number = serializers.CharField(source='trip.trip_number', read_only=True)
    vehicle_number = serializers.CharField(source='trip.vehicle.vehicle_number', read_only=True)
    
    # ✅ Fixed: Proper customer name fetching
    customer_name = serializers.CharField(source='customer.full_name', read_only=True)
    customer_company = serializers.CharField(source='customer.company', read_only=True)

    class Meta:
        model = TransportInvoice
        fields = [
            'id', 
            'invoice_number', 
            'trip', 
            'trip_number', 
            'vehicle_number',
            'customer', 
            'customer_name', 
            'customer_company',
            'invoice_date', 
            'due_date',
            'taxable_amount', 
            'gst_percentage', 
            'gst_amount', 
            'grand_total',
            'amount_paid', 
            'payment_status', 
            'payment_status_display',
            'notes', 
            'created_at', 
            'updated_at'
        ]
        read_only_fields = ['invoice_number', 'gst_amount', 'grand_total', 'payment_status']