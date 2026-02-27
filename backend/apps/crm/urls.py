# apps/crm/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CallLogViewSet, ContactViewSet, OpportunityViewSet, CallLogSerializer

router = DefaultRouter()

# Explicit basename – safest when using get_queryset()
router.register(r'contacts',     ContactViewSet,     basename='crm-contacts')
router.register(r'opportunities', OpportunityViewSet, basename='crm-opportunities')
router.register(r'call-logs', CallLogViewSet, basename='crm-call-logs')
urlpatterns = [
    path('', include(router.urls)),
]