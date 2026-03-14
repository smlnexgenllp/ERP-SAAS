from django.urls import path
from .views import *

urlpatterns = [

    # ITEM SALES SUMMARY
    path(
        "item-sales-summary/",
        ItemSalesSummaryView.as_view(),
        name="item-sales-summary"
    ),

    # PRODUCTION PLAN
    path(
        "production-plans/",
        ProductionPlanListView.as_view(),
        name="production-plan-list"
    ),

    path(
        "production-plans/create/",
        ProductionPlanCreateView.as_view(),
        name="production-plan-create"
    ),

    # RUN MRP
    path(
        "run-mrp/<int:pk>/",
        RunMRPView.as_view(),
        name="run-mrp"
    ),

    # PLANNED ORDERS
    path(
        "planned-orders/",
        PlannedOrderListView.as_view(),
        name="planned-orders"
    ),

    # CONVERT TO MO
    path(
        "convert-to-mo/<int:pk>/",
        ConvertToMOView.as_view(),
        name="convert-to-mo"
    ),

    # MANUFACTURING ORDERS
    path(
        "manufacturing-orders/",
        ManufacturingOrderListView.as_view(),
        name="manufacturing-orders"
    ),

    path(
        "manufacturing-orders/start/<int:pk>/",
        ManufacturingOrderStartView.as_view(),
        name="mo-start"
    ),

    path(
        "manufacturing-orders/complete/<int:pk>/",
        ManufacturingOrderCompleteView.as_view(),
        name="mo-complete"
    ),
    path(
    "planned-orders/create/",
    PlannedOrderCreateView.as_view(),
),
]