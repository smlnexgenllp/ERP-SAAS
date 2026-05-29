# apps/transport/views.py

from rest_framework import viewsets

from .models import (
    Vehicle,
    Driver,
    TransportTrip,
    FuelEntry,
    VehicleMaintenance,
    TransportExpense,
    TransportInvoice,
)

from .serializers import (
    VehicleSerializer,
    DriverSerializer,
    TransportTripSerializer,
    FuelEntrySerializer,
    VehicleMaintenanceSerializer,
    TransportExpenseSerializer,
    TransportInvoiceSerializer,
)


# =========================================================
# VEHICLE
# =========================================================

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by("-id")
    serializer_class = VehicleSerializer


# =========================================================
# DRIVER
# =========================================================

class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all().order_by("-id")
    serializer_class = DriverSerializer


# =========================================================
# TRANSPORT TRIP
# =========================================================

class TransportTripViewSet(viewsets.ModelViewSet):
    queryset = TransportTrip.objects.all().order_by("-id")
    serializer_class = TransportTripSerializer


# =========================================================
# FUEL ENTRY
# =========================================================

class FuelEntryViewSet(viewsets.ModelViewSet):
    queryset = FuelEntry.objects.all().order_by("-id")
    serializer_class = FuelEntrySerializer


# =========================================================
# VEHICLE MAINTENANCE
# =========================================================

class VehicleMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = VehicleMaintenance.objects.all().order_by("-id")
    serializer_class = VehicleMaintenanceSerializer


# =========================================================
# TRANSPORT EXPENSE
# =========================================================

class TransportExpenseViewSet(viewsets.ModelViewSet):
    queryset = TransportExpense.objects.all().order_by("-id")
    serializer_class = TransportExpenseSerializer


# =========================================================
# TRANSPORT INVOICE
# =========================================================

class TransportInvoiceViewSet(viewsets.ModelViewSet):
    queryset = TransportInvoice.objects.all().order_by("-id")
    serializer_class = TransportInvoiceSerializer