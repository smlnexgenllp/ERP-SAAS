# inventory/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AllDepartmentStockView,
    CustomerListAPIView,
    DepartmentStockAPIView,
    DispatchViewSet,
    InventoryDashboardStatsView,
    InventoryDashboardStatsAPIView,
    ItemDepartmentStockView,
    ItemListForQuotation,
    ItemViewSet,
    PurchaseOrderViewSet,
    GateEntryViewSet,
    GRNViewSet,
    QualityInspectionViewSet,
    SalesOrdersByItemAPIView,
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
router.register(r'dispatch', DispatchViewSet, basename='dispatch')

urlpatterns = [
    path('', include(router.urls)),
    path('material-transfer/', MaterialTransferAPIView.as_view(), name='material-transfer'),
    path('sales-orders/by-item/<int:item_id>/', SalesOrdersByItemAPIView.as_view(), name='sales-orders-by-item'),
    path('customers/', CustomerListAPIView.as_view(), name='customer-list'),
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