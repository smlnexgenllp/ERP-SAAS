# apps/production/urls.py
from django.urls import path
from .views import (
    # Existing views
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
    ManufacturingOrderUpdateView,
    ItemProcessCreateView,
    RunSingleItemMRPView,
    DepartmentTransactionCreateView,
    DepartmentTransactionsByDeptView,
    start_transaction,
    complete_transaction,
    MachineLoadView,
    ProductionPlanAPIView,
    ProductionPlanDetailAPIView,
    MachineAPIView,
    MachineAvailabilityAPIView,
    MachineSuggestDatesAPIView,
#     ManufacturingOrderAPIView,
#     ManufacturingOrderDetailAPIView,
#     AssignMachineToManufacturingOrderAPIView,
#     ProductionPlanManufacturingOrdersAPIView,
#     ManufacturingOrderAvailabilityAPIView
AssignMachinesAPIView,DraftManufacturingOrdersAPIView,AvailableMachinesAPIView,
    RunSingleItemMRPView,MachineAvailabilityCheckAPIView,
    DraftManufacturingOrdersAPIView,
    AvailableMachinesAPIView,
    AssignMachinesAPIView,
    MachineAvailabilityCheckAPIView,

    # NEW: Work Order Views
    WorkOrderListView,
    WorkOrderActionView,
)

urlpatterns = [
    # MRP & Demand
    path('item-sales-summary/', ItemSalesSummaryView.as_view(), name='item-sales-summary'),

    # Production Plans
    path('production-plans/', ProductionPlanListView.as_view(), name='production-plan-list'),
    path('production-plans/create/', ProductionPlanCreateView.as_view(), name='production-plan-create'),

    # MRP
    path('run-mrp/', RunMRPView.as_view(), name='run-mrp'),
    path('mrp-item/<int:pk>/', RunSingleItemMRPView.as_view(), name='run-single-item-mrp'),

    # Planned Orders
    path('planned-orders/', PlannedOrderListView.as_view(), name='planned-order-list'),
    path('planned-orders/create/', PlannedOrderCreateView.as_view(), name='planned-order-create'),
    path('planned-orders/<int:pk>/convert-to-mo/', ConvertToMOView.as_view(), name='convert-to-mo'),

    # Manufacturing Orders
    path('manufacturing-orders/', ManufacturingOrderListView.as_view(), name='manufacturing-order-list'),
    path('manufacturing-orders/<int:pk>/', ManufacturingOrderUpdateView.as_view(), name='manufacturing-order-update'),
    path('manufacturing-orders/<int:pk>/start/', ManufacturingOrderStartView.as_view(), name='mo-start'),
    path('manufacturing-orders/<int:pk>/complete/', ManufacturingOrderCompleteView.as_view(), name='mo-complete'),

    # Department Transactions
    path('process/create/', ItemProcessCreateView.as_view(), name='process-create'),
    path('department/<int:dept_id>/transactions/', DepartmentTransactionsByDeptView.as_view(), name='dept-transactions'),
    path('transaction/create/', DepartmentTransactionCreateView.as_view(), name='transaction-create'),
    path('department-transaction/<int:pk>/start/', start_transaction),
    path('department-transaction/<int:pk>/complete/', complete_transaction),

    # Machines
    path('machine-load/', MachineLoadView.as_view(), name='machine-load'),
    path('machines/list/', MachineAPIView.as_view(), name='machines'),
    path('machines/<int:machine_id>/availability/', MachineAvailabilityAPIView.as_view(), name='machine-availability'),
    path('machines/<int:machine_id>/suggest-dates/', MachineSuggestDatesAPIView.as_view(), name='machine-suggest-dates'),
    path('machine-availability/', MachineAvailabilityCheckAPIView.as_view(), name='machine-availability-check'),

    # Assignment
    path('draft-orders/', DraftManufacturingOrdersAPIView.as_view(), name='draft-orders'),
    path('machines-list/', AvailableMachinesAPIView.as_view(), name='machines-list'),
    path('assign-machines/', AssignMachinesAPIView.as_view(), name='assign-machines'),

    # ====================== WORK ORDERS ======================
    path('work-orders/', WorkOrderListView.as_view(), name='work-order-list'),
    path('work-orders/<int:pk>/', WorkOrderActionView.as_view(), name='work-order-action'),
]