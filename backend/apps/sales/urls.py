from django.urls import path
from rest_framework.routers import DefaultRouter
from django.urls import include
from .views import (
    ConvertToCustomerView,
    CreateQuotationFromLeadView,
    CustomerDetailView,
    CustomerLedgerView,
    CustomerListView,
    CustomerUpdateView,
    FollowUpListCreateView,
    GSTSettingsAPIView,
    QualifiedLeadsListView,
    QualifiedLeadDetailView,
    QuotationListView,
    QuotationDetailView,
    QuotationStatusUpdateView,
    SalesInvoiceViewSet,
    SalesOrderCreateView,
    SalesOrderDeleteView,
    SalesOrderListView,
    SalesOrderStatusUpdateView,
    SalesOrderUpdateView,
    SalesDashboardSummaryView,
    SalesDashboardMyItemsView,
    SalesDashboardTeamPerformanceView,
    SalesPaymentViewSet,
    # VendorLedgerView,
    current_organization,
)
router = DefaultRouter()
router.register(r'invoices', SalesInvoiceViewSet, basename='salesinvoice')
router.register(r'payments', SalesPaymentViewSet, basename='salespayment')
urlpatterns = [
    path('qualified-leads/', QualifiedLeadsListView.as_view()),
path('qualified-leads/<int:id>/', QualifiedLeadDetailView.as_view()),
path('quotations/create-from-lead/', CreateQuotationFromLeadView.as_view()),
path('quotations/', QuotationListView.as_view()),
path('quotations/<int:pk>/', QuotationDetailView.as_view()),
path('quotations/<int:pk>/status/', QuotationStatusUpdateView.as_view()),
path('quotations/<int:quotation_id>/followups/', FollowUpListCreateView.as_view()),
path('quotations/<int:pk>/convert-to-customer/', ConvertToCustomerView.as_view(), name='convert-to-customer'),
path('customers/', CustomerListView.as_view(), name='customer-list'),
path('customers/<int:pk>/', CustomerDetailView.as_view(), name='customer-detail'),
path('customers/<int:pk>/edit/', CustomerUpdateView.as_view(), name='customer-update'),
path('sales-orders/create/', SalesOrderCreateView.as_view(), name='sales-order-create'),
path('sales-orders/', SalesOrderListView.as_view(), name='sales-order-list'),
path('sales-orders/<int:pk>/', SalesOrderDeleteView.as_view(), name='sales-order-delete'),
path('gst-settings/', GSTSettingsAPIView.as_view(), name='gst-settings'),

path('sales-orders/<int:pk>/status/', SalesOrderStatusUpdateView.as_view(), name='sales-order-status'),

path('dashboard/summary/', SalesDashboardSummaryView.as_view(), name='dashboard-summary'),
path('dashboard/my-items/', SalesDashboardMyItemsView.as_view(), name='dashboard-my-items'),
path('organization/', current_organization, name='current-organization'),
# urls.py
path("customer-ledger/<int:customer_id>/", CustomerLedgerView.as_view()),
#  path('sale/vendor-ledger/<int:vendor_id>/', VendorLedgerView.as_view()),
path('dashboard/team-performance/', SalesDashboardTeamPerformanceView.as_view(), name='dashboard-team-performance'),
path('', include(router.urls)),
]