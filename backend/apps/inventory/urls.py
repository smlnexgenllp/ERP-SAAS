from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .views import (
    ItemViewSet,
    PurchaseOrderViewSet,
    GateEntryViewSet,
    GRNViewSet,
    QualityInspectionViewSet,
    VendorInvoiceViewSet,
    VendorPaymentViewSet,
)

router = DefaultRouter()

router.register(r'items', ItemViewSet, basename='items')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-orders')
router.register(r'gate-entries', GateEntryViewSet, basename='gate-entries')
router.register(r'grns', GRNViewSet, basename='grns')
router.register(r'quality-inspections', QualityInspectionViewSet, basename='quality-inspections')
router.register(r'vendor-invoices', VendorInvoiceViewSet, basename='vendor-invoices')
router.register(r'vendor-payments', VendorPaymentViewSet, basename='vendor-payments')

urlpatterns = [
    path('', include(router.urls)),
]