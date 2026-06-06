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
    TransportInvoiceViewSet,TransportRouteViewSet
)

router = DefaultRouter()

router.register(r"vehicles", VehicleViewSet)
router.register(r"drivers", DriverViewSet)
router.register(r'trips', TransportTripViewSet, basename='transport-trip')
router.register(r"fuel-entries", FuelEntryViewSet)
router.register(r'transport-expenses', TransportExpenseViewSet)
router.register(r"transport-invoices", TransportInvoiceViewSet)
router.register(r'routes', TransportRouteViewSet, basename='transport-route')
router.register(r'vehicle-maintenance', VehicleMaintenanceViewSet, basename='vehicle-maintenance')

urlpatterns = [
    path("", include(router.urls)),
]