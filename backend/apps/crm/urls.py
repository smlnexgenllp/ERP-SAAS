# apps/crm/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

# Import all the ViewSets you're using
from .views import (
    ContactViewSet,
    OpportunityViewSet,
    CallLogViewSet,
    ProductViewSet,
    ActivityViewSet,
    CustomerViewSet,
    QuotationViewSet,
    
)

# Create router
router = DefaultRouter()

# Register all resource endpoints
# Using consistent basename pattern helps with reverse URLs and avoids conflicts
router.register(r'contacts',        ContactViewSet,        basename='crm-contact')
router.register(r'opportunities',   OpportunityViewSet,     basename='crm-opportunity')
router.register(r'call-logs',       CallLogViewSet,         basename='crm-call-log')
router.register(r'products',        ProductViewSet,          basename='crm-product')
router.register(r'activities',      ActivityViewSet,         basename='crm-activity')
router.register(r'customers',       CustomerViewSet,         basename='crm-customer')
router.register(r'quotations',      QuotationViewSet,        basename='crm-quotation')




urlpatterns = [
    path('', include(router.urls)),
    
    # You can add non-ViewSet endpoints here if needed in the future
    # path('reports/sales-pipeline/', SalesPipelineReportView.as_view(), name='sales-pipeline-report'),
    # path('reports/revenue/', RevenueReportView.as_view(), name='revenue-report'),
]