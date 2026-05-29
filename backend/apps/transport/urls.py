# apps/transport/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    VehicleViewSet,
    DriverViewSet,
    TransportTripViewSet,
    FuelEntryViewSet,
    VehicleMaintenanceViewSet,
    TransportExpenseViewSet,
    TransportInvoiceViewSet,
)

router = DefaultRouter()

router.register(r"vehicles", VehicleViewSet)
router.register(r"drivers", DriverViewSet)
router.register(r"trips", TransportTripViewSet)
router.register(r"fuel-entries", FuelEntryViewSet)
router.register(r"maintenance", VehicleMaintenanceViewSet)
router.register(r"expenses", TransportExpenseViewSet)
router.register(r"invoices", TransportInvoiceViewSet)

urlpatterns = [
    path("", include(router.urls)),
]