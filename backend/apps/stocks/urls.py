# apps/stock/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import StockItemViewSet, StockLedgerViewSet

router = DefaultRouter()
router.register(r'items', StockItemViewSet, basename='stock-items')
router.register(r'ledger', StockLedgerViewSet, basename='stock-ledger')

urlpatterns = [
    path('', include(router.urls)),
]