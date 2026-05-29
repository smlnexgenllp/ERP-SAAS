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


# =========================================================
# VEHICLE
# =========================================================

class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = "__all__"


# =========================================================
# DRIVER
# =========================================================

class DriverSerializer(serializers.ModelSerializer):
    class Meta:
        model = Driver
        fields = "__all__"


# =========================================================
# ROUTE
# =========================================================

class TransportRouteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransportRoute
        fields = "__all__"


# =========================================================
# TRIP ITEM
# =========================================================

class TransportTripItemSerializer(serializers.ModelSerializer):

    item_name = serializers.CharField(
        source="item.name",
        read_only=True
    )

    class Meta:
        model = TransportTripItem
        fields = "__all__"


# =========================================================
# TRANSPORT TRIP
# =========================================================

class TransportTripSerializer(serializers.ModelSerializer):

    vehicle_name = serializers.CharField(
        source="vehicle.vehicle_number",
        read_only=True
    )

    driver_name = serializers.CharField(
        source="driver.full_name",
        read_only=True
    )

    route_name = serializers.SerializerMethodField()

    items = TransportTripItemSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = TransportTrip
        fields = "__all__"

    def get_route_name(self, obj):
        if obj.route:
            return f"{obj.route.source_location} → {obj.route.destination_location}"
        return None


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


# =========================================================
# VEHICLE MAINTENANCE
# =========================================================

class VehicleMaintenanceSerializer(serializers.ModelSerializer):

    vehicle_name = serializers.CharField(
        source="vehicle.vehicle_number",
        read_only=True
    )

    class Meta:
        model = VehicleMaintenance
        fields = "__all__"


# =========================================================
# TRANSPORT EXPENSE
# =========================================================

class TransportExpenseSerializer(serializers.ModelSerializer):

    vehicle_name = serializers.CharField(
        source="vehicle.vehicle_number",
        read_only=True
    )

    class Meta:
        model = TransportExpense
        fields = "__all__"


# =========================================================
# TRANSPORT INVOICE
# =========================================================

class TransportInvoiceSerializer(serializers.ModelSerializer):

    trip_details = serializers.SerializerMethodField()

    class Meta:
        model = TransportInvoice
        fields = "__all__"

    def get_trip_details(self, obj):

        if obj.trip:
            return {
                "id": obj.trip.id,
                "trip_number": obj.trip.trip_number,
            }

        return None