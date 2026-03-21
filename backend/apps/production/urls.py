# apps/production/urls.py

from django.urls import path
from .views import (
    # MRP / Demand
    ItemSalesSummaryView,
    
    # Production Plans
    ProductionPlanCreateView,
    ProductionPlanListView,
    
    # MRP Run
    RunMRPView,
    
    # Dashboard Counters
    ProductionDashboardView,
    
    # Planned Orders
    PlannedOrderListView,
    PlannedOrderCreateView,
    
    # Convert Planned → MO
    ConvertToMOView,
    
    # Manufacturing Orders
    ManufacturingOrderListView,
    ManufacturingOrderStartView,
    ManufacturingOrderCompleteView,MachineLoadView,
)

app_name = 'production'  # optional: useful for namespacing reverse URLs

urlpatterns = [
    # ──────────────────────────────────────────────
    # MRP & Demand Overview
    # ──────────────────────────────────────────────
    path('item-sales-summary/', 
         ItemSalesSummaryView.as_view(), 
         name='item-sales-summary'),

    # ──────────────────────────────────────────────
    # Production Plans
    # ──────────────────────────────────────────────
    path('production-plans/', 
         ProductionPlanListView.as_view(), 
         name='production-plan-list'),
    
    path('production-plans/create/', 
         ProductionPlanCreateView.as_view(), 
         name='production-plan-create'),

    # ──────────────────────────────────────────────
    # Run MRP (global or per plan – currently global)
    # ──────────────────────────────────────────────
    path('run-mrp/', 
         RunMRPView.as_view(), 
         name='run-mrp'),

    # If you later want per-plan MRP (optional):
    # path('production-plans/<int:pk>/run-mrp/', RunMRPView.as_view(), name='run-mrp-plan'),

    # ──────────────────────────────────────────────
    # Dashboard Overview / Counters
    # ──────────────────────────────────────────────
    path('dashboard/', 
         ProductionDashboardView.as_view(), 
         name='production-dashboard'),

    # ──────────────────────────────────────────────
    # Planned Orders
    # ──────────────────────────────────────────────
    path('planned-orders/', 
         PlannedOrderListView.as_view(), 
         name='planned-order-list'),
    
    path('planned-orders/create/', 
         PlannedOrderCreateView.as_view(), 
         name='planned-order-create'),

    # Convert Planned Order to Manufacturing Order
    path('planned-orders/<int:pk>/convert-to-mo/', 
         ConvertToMOView.as_view(), 
         name='planned-to-mo'),

    # ──────────────────────────────────────────────
    # Manufacturing Orders (Work Orders)
    # ──────────────────────────────────────────────
    path('manufacturing-orders/', 
         ManufacturingOrderListView.as_view(), 
         name='manufacturing-order-list'),

    path('manufacturing-orders/<int:pk>/start/', 
         ManufacturingOrderStartView.as_view(), 
         name='mo-start'),

    path('manufacturing-orders/<int:pk>/complete/', 
         ManufacturingOrderCompleteView.as_view(), 
         name='mo-complete'),
    path('machine-load/', 
         MachineLoadView.as_view(), 
         name='machine-load'),     
]