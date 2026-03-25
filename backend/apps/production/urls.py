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
    RunSingleItemMRPView,
    complete_transaction,
    start_transaction, 
    ManufacturingOrderCompleteView,MachineLoadView,
    ProductionPlanAPIView,
    ProductionPlanDetailAPIView,
    MachineAPIView,
#     MachineLoadDataAPIView,
    MachineAvailabilityAPIView,
    MachineSuggestDatesAPIView,
#     ManufacturingOrderAPIView,
#     ManufacturingOrderDetailAPIView,
#     AssignMachineToManufacturingOrderAPIView,
#     ProductionPlanManufacturingOrdersAPIView,
#     ManufacturingOrderAvailabilityAPIView
AssignMachinesAPIView,DraftManufacturingOrdersAPIView,AvailableMachinesAPIView
    RunSingleItemMRPView
)

urlpatterns = [
    # MRP & Demand
    path('item-sales-summary/', ItemSalesSummaryView.as_view(), name='item-sales-summary'),
    
    # Production Plans
    path('production-plans/', ProductionPlanListView.as_view(), name='production-plan-list'),
    path('production-plans/create/', ProductionPlanCreateView.as_view(), name='production-plan-create'),
    
    # MRP Run
    path('run-mrp/', RunMRPView.as_view(), name='run-mrp'),
    path('mrp-item/<int:pk>',RunSingleItemMRPView.as_view(), name='run-single-item-mrp'),
    
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
    path('planned-orders/create/', 
         PlannedOrderCreateView.as_view(), 
         name='planned-order-create'),

    # Convert Planned Order to Manufacturing Order
    path('planned-orders/<int:pk>/convert-to-mo/', 
         ConvertToMOView.as_view(), 
         name='planned-to-mo'),

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

     path('production-plans/', 
     ProductionPlanAPIView.as_view(), 
     name='production_plans'),

     path('production-plans/<int:pk>/details/', 
          ProductionPlanDetailAPIView.as_view(), 
          name='plan_details'),

     
     # path('machines/load-data/', 
     #      MachineLoadDataAPIView.as_view(), 
     #      name='machine_load'),

     path('machines/<int:machine_id>/availability/', 
          MachineAvailabilityAPIView.as_view(), 
          name='machine_availability'),

     path('machines/<int:machine_id>/suggest-dates/', 
          MachineSuggestDatesAPIView.as_view(), 
          name='machine_suggest_dates'),
     #  path('production-plans/<int:plan_id>/assign-machine/', 
     #     AssignMachineAPIView.as_view(), 
     #     name='assign_machine'),

     # ADD NEW URLs for Manufacturing Orders
#     path('manufacturing-orders/', 
#          ManufacturingOrderAPIView.as_view(), 
#          name='manufacturing_orders'),
    
#     path('manufacturing-orders/<int:pk>/', 
#          ManufacturingOrderDetailAPIView.as_view(), 
#          name='manufacturing_order_detail'),
    
#     path('manufacturing-orders/<int:mo_id>/assign-machine/', 
#          AssignMachineToManufacturingOrderAPIView.as_view(), 
#          name='assign_machine_to_mo'),
    
    # Production Plan with Manufacturing Orders
#     path('production-plans/<int:plan_id>/manufacturing-orders/', 
#          ProductionPlanManufacturingOrdersAPIView.as_view(), 
#          name='plan_manufacturing_orders'),
    
#     path('production-plans/<int:plan_id>/check-availability/', 
#          ManufacturingOrderAvailabilityAPIView.as_view(), 
#          name='check_mo_availability'),  

     # path('manufacturing-orders/<int:mo_id>/work-orders/', 
     #     WorkOrderListByManufacturingOrderView.as_view(), 
     #     name='work_orders_by_mo'),
    
#     # Work Order operations
#     path('work-orders/<int:wo_id>/availability/', 
#          WorkOrderAvailabilityAPIView.as_view(), 
#          name='work_order_availability'),
    
#     path('work-orders/<int:wo_id>/suggest-dates/', 
#          WorkOrderSuggestDatesAPIView.as_view(), 
#          name='work_order_suggest_dates'),
    
#     path('work-orders/<int:wo_id>/assign-machine/', 
#          AssignMachineToWorkOrderView.as_view(), 
#          name='assign_machine_to_work_order'),  

    path('machines/list', MachineAPIView.as_view(), name='machines'),   
  path('draft-orders/', DraftManufacturingOrdersAPIView.as_view()),
    path('machines-list/', AvailableMachinesAPIView.as_view()),
    path('assign-machines/', AssignMachinesAPIView.as_view()),

       
]