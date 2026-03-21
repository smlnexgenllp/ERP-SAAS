# apps/production/urls.py
from django.urls import path
from .views import (
    DepartmentTransactionCreateView,
    DepartmentTransactionsByDeptView,
    ItemSalesSummaryView,
    ProductionPlanListView,
    ProductionPlanCreateView,
    RunMRPView,
    PlannedOrderListView,
    PlannedOrderCreateView,
    ConvertToMOView,
    ManufacturingOrderListView,
    ManufacturingOrderStartView,
    ManufacturingOrderCompleteView,
    ItemProcessCreateView,
    complete_transaction,
    start_transaction, 
)

urlpatterns = [
    # MRP & Demand
    path('item-sales-summary/', ItemSalesSummaryView.as_view(), name='item-sales-summary'),
    
    # Production Plans
    path('production-plans/', ProductionPlanListView.as_view(), name='production-plan-list'),
    path('production-plans/create/', ProductionPlanCreateView.as_view(), name='production-plan-create'),
    
    # MRP Run
    path('run-mrp/', RunMRPView.as_view(), name='run-mrp'),
    
    # Planned Orders
    path('planned-orders/', PlannedOrderListView.as_view(), name='planned-order-list'),
    path('planned-orders/create/', PlannedOrderCreateView.as_view(), name='planned-order-create'),
    path('planned-orders/<int:pk>/convert-to-mo/', ConvertToMOView.as_view(), name='convert-to-mo'),
    
    # Manufacturing Orders
    path('manufacturing-orders/', ManufacturingOrderListView.as_view(), name='manufacturing-order-list'),
    path('manufacturing-orders/<int:pk>/start/', ManufacturingOrderStartView.as_view(), name='mo-start'),
    path('manufacturing-orders/<int:pk>/complete/', ManufacturingOrderCompleteView.as_view(), name='mo-complete'),
    path('process/create/', ItemProcessCreateView.as_view(), name='process-create'),
path('department/<int:dept_id>/transactions/', DepartmentTransactionsByDeptView.as_view(), name='dept-transactions'),
path('transaction/create/', DepartmentTransactionCreateView.as_view(), name='transaction-create'),
 path("department-transaction/<int:pk>/start/", start_transaction),
path("department-transaction/<int:pk>/complete/", complete_transaction),
]