from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ItemViewSet,PurchaseOrderViewSet

router = DefaultRouter()
router.register("purchase-orders", PurchaseOrderViewSet, basename="purchase-order")
router.register("items", ItemViewSet, basename="item")

urlpatterns = [
    path('', include(router.urls)),
]
