# apps/crm/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ContactViewSet, OpportunityViewSet, CallLogViewSet,
    ProductViewSet, ActivityViewSet, CustomerViewSet,
    QuotationViewSet, SalesOrderViewSet, InvoiceViewSet,
    PaymentViewSet,
)

router = DefaultRouter()

router.register(r'contacts',        ContactViewSet,        basename='crm-contact')
router.register(r'opportunities',   OpportunityViewSet,     basename='crm-opportunity')
router.register(r'call-logs',       CallLogViewSet,         basename='crm-call-log')
router.register(r'products',        ProductViewSet,          basename='crm-product')
router.register(r'activities',      ActivityViewSet,         basename='crm-activity')
router.register(r'customers',       CustomerViewSet,         basename='crm-customer')
router.register(r'quotations',      QuotationViewSet,        basename='crm-quotation')
router.register(r'sales-orders',    SalesOrderViewSet,       basename='crm-sales-order')
router.register(r'invoices',        InvoiceViewSet,          basename='crm-invoice')
router.register(r'payments',        PaymentViewSet,          basename='crm-payment')

urlpatterns = [
    path('', include(router.urls)),
]