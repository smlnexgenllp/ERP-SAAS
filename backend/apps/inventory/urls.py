# inventory/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AllDepartmentStockView,
    DepartmentStockAPIView,
    InventoryDashboardStatsView,
    InventoryDashboardStatsAPIView,
    ItemDepartmentStockView,
    ItemListForQuotation,
    ItemViewSet,
    PurchaseOrderViewSet,
    GateEntryViewSet,
    GRNViewSet,
    QualityInspectionViewSet,
    VendorInvoiceViewSet,
    VendorPaymentViewSet,
    MachineViewSet,
    MaterialTransferAPIView,           # ← the combined one
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
    path('material-transfer/', MaterialTransferAPIView.as_view(), name='material-transfer'),
    path('items-for-quotation/', ItemListForQuotation.as_view(), name='items-for-quotation'),
    path('department-stock/', DepartmentStockAPIView.as_view()),
    path('dashboard-stats/', InventoryDashboardStatsAPIView.as_view(), name='inventory-dashboard-stats'),
    path('inventory/dashboard-stats/', InventoryDashboardStatsView.as_view(), name='inventory-dashboard-stats-old'),
    path(
        'item/<int:item_id>/department/<int:dept_id>/stock/',
        ItemDepartmentStockView.as_view(),
        name='item-dept-stock'
    ),
    path('all-department-stock/', AllDepartmentStockView.as_view(), name='all-department-stock'),
]