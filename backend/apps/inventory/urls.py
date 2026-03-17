from rest_framework.routers import DefaultRouter
from django.urls import path, include

from .views import (
    InventoryDashboardStatsView,
    ItemListForQuotation,
    ItemViewSet,
    PurchaseOrderViewSet,
    GateEntryViewSet,
    GRNViewSet,
    QualityInspectionViewSet,
    VendorInvoiceViewSet,
    VendorPaymentViewSet,InventoryDashboardStatsAPIView,MachineViewSet
)

router = DefaultRouter()

router.register(r'items', ItemViewSet, basename='items')
router.register(r'purchase-orders', PurchaseOrderViewSet, basename='purchase-orders')
router.register(r'gate-entries', GateEntryViewSet, basename='gate-entries')
router.register(r'grns', GRNViewSet, basename='grns')
router.register(r'quality-inspections', QualityInspectionViewSet, basename='quality-inspections')
router.register(r'vendor-invoices', VendorInvoiceViewSet, basename='vendor-invoices')
router.register(r'vendor-payments', VendorPaymentViewSet, basename='vendor-payments')
router.register(r'machines', MachineViewSet, basename='machines')


urlpatterns = [
    path('', include(router.urls)),
    path('items-for-quotation/', ItemListForQuotation.as_view(), name='items-for-quotation'),
    path('dashboard-stats/', InventoryDashboardStatsAPIView.as_view(), name='inventory-dashboard-stats'),
    path('inventory/dashboard-stats/', InventoryDashboardStatsView.as_view(), name='inventory-dashboard-stats'),
]