# apps/crm/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContactViewSet, OpportunityViewSet

router = DefaultRouter()

# Explicit basename – safest when using get_queryset()
router.register(r'contacts',     ContactViewSet,     basename='crm-contacts')
router.register(r'opportunities', OpportunityViewSet, basename='crm-opportunities')

urlpatterns = [
    path('', include(router.urls)),
]