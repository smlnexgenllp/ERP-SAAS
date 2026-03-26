# apps/production/views.py

from collections import defaultdict
from decimal import Decimal
from datetime import timedelta

from django.utils import timezone
from django.db.models import Sum, Q, Value, DecimalField
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework import generics
from django.views.generic import ListView, DetailView
from django.views import View

from .models import (
    ProductionPlan, PurchaseRequisition,
    ManufacturingOrder, MOOperation,
    BillOfMaterial, Routing, RoutingOperation,
    PlannedOrder, ItemProcess, ItemProcessStep,
    DepartmentTransaction,ProductionOrder
)

from .serializers import (
    ProductionPlanSerializer, PlannedOrderSerializer,
    PurchaseRequisitionSerializer, ManufacturingOrderSerializer,
    ItemProcessSerializer, ItemProcessCreateUpdateSerializer,
    DepartmentTransactionListSerializer, DepartmentTransactionCreateSerializer
)

from apps.inventory.models import Item, StockLedger, Machine
from apps.sales.models import SalesOrder, SalesOrderItem
from apps.inventory.serializers import MachineSerializer
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from datetime import datetime
# =========================================================
# ITEM SALES SUMMARY
# =========================================================
from django.db.models import Sum, Value, DecimalField, Q
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg

class ItemSalesSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.user.organization

        data = (
            SalesOrderItem.objects
            .filter(sales_order__organization=org)
            .select_related("product")
            .values(
                "product__id",
                "product__name",
                "product__code",
                "product__uom"
            )
            .annotate(
                total_sales_qty=Sum("quantity"),

                sales_orders=ArrayAgg("sales_order__id", distinct=True),
                sales_order_numbers=ArrayAgg("sales_order__order_number", distinct=True),

                current_stock=Coalesce(
                    Sum(
                        "product__grnitem__received_qty",
                        filter=Q(product__grnitem__grn__status="approved"),
                        output_field=DecimalField()
                    ),
                    Value(0, output_field=DecimalField())
                )
            )
        )

        result = []

        for row in data:
            product_id = row["product__id"]

            # 🔥 GET PLANNED QTY
            planned_qty = PlannedOrder.objects.filter(
                product_id=product_id,
                production_plan__organization=org,
                status__in=["planned", "confirmed"]   # only active
            ).aggregate(
                total=Coalesce(Sum("quantity"), 0)
            )["total"]

            demand = float(row["total_sales_qty"] or 0)
            stock = float(row["current_stock"] or 0)
            planned = float(planned_qty or 0)

            # ✅ FINAL FORMULA
            required = demand - stock - planned

            row["planned_qty"] = planned
            row["required_production"] = required if required > 0 else 0

            result.append(row)

        return Response(result)

# =========================================================
# PRODUCTION PLAN
# =========================================================
class ProductionPlanListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = ProductionPlan.objects.filter(
            organization=request.user.organization
        ).prefetch_related("sales_orders").select_related("created_by").order_by("-created_at")

        return Response(ProductionPlanSerializer(plans, many=True).data)


class ProductionPlanCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProductionPlanSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                organization=request.user.organization,
                created_by=request.user
            )
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


# =========================================================
# MRP RUN
# =========================================================

# =========================================================
# DASHBOARD
# =========================================================
class ProductionDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.user.organization
        return Response({
            "production_plans": ProductionPlan.objects.filter(organization=org).count(),
            "planned_orders": PlannedOrder.objects.filter(production_plan__organization=org).count(),
            "running_production": ManufacturingOrder.objects.filter(
                planned_order__production_plan__organization=org,
                status="in_progress"
            ).count(),
            "completed_production": ManufacturingOrder.objects.filter(
                planned_order__production_plan__organization=org,
                status="done"
            ).count(),
        })


# =========================================================
# PLANNED ORDERS
# =========================================================
class PlannedOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = PlannedOrder.objects.filter(
            production_plan__organization=request.user.organization
        ).select_related("product").prefetch_related("sales_orders")

        data = []

        for o in orders:
            data.append({
                "id": o.id,
                "product_id": o.product.id,
                "product_name": o.product.name,
                "quantity": float(o.quantity),
                "planned_start": o.planned_start.isoformat() if o.planned_start else None,
                "planned_finish": o.planned_finish.isoformat() if o.planned_finish else None,
                "status": o.status,
                "scheduling_type": o.scheduling_type,

                "sales_orders": [
                    {"id": so.id, "order_number": so.order_number}
                    for so in o.sales_orders.all()
                ],

                "bom_details": get_bom_status(o.product, o.quantity)   # ← Now correct
            })

        return Response(data)
    # =========================================================
# CONVERT TO MO
# =========================================================
class ConvertToMOView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        planned = PlannedOrder.objects.get(id=pk)

        mo = ManufacturingOrder.objects.create(
            planned_order=planned,
            product=planned.product,
            quantity=planned.quantity,
            status="draft"
        )

        routing = Routing.objects.filter(product=planned.product).first()
        if routing:
            for op in routing.operations.all():
                MOOperation.objects.create(
                    manufacturing_order=mo,
                    work_center=op.work_center,
                    operation_name=op.operation_name,
                    sequence=op.sequence
                )

        planned.status = "converted"
        planned.save()

        return Response({"detail": "Converted"})


# =========================================================
# MANUFACTURING ORDERS
# =========================================================
# ====================== MANUFACTURING ORDERS ======================

# class ManufacturingOrderListView(APIView):
#     """
#     List all manufacturing orders.
#     Optional: Filter by production plan using ?plan_id=123
#     """
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         organization = request.user.organization
#         plan_id = request.query_params.get('plan_id')

#         queryset = ManufacturingOrder.objects.filter(
#             planned_order__production_plan__organization=organization
#         ).select_related('product', 'planned_order', 'machine')

#         if plan_id:
#             queryset = queryset.filter(planned_order__production_plan_id=plan_id)

#         # You can also add more filters if needed
#         status_filter = request.query_params.get('status')
#         if status_filter:
#             queryset = queryset.filter(status=status_filter)

#         serializer = ManufacturingOrderSerializer(queryset, many=True)
#         return Response(serializer.data)


# =========================================================
# DEPARTMENT TRANSACTIONS
# =========================================================
@api_view(["PATCH"])
def start_transaction(request, pk):
    txn = DepartmentTransaction.objects.get(id=pk)
    txn.status = "in_progress"
    txn.started_at = timezone.now()
    txn.save()
    return Response({"message": "Started"})


@api_view(["PATCH"])
def complete_transaction(request, pk):
    txn = DepartmentTransaction.objects.get(id=pk)
    txn.status = "completed"
    txn.completed_at = timezone.now()
    txn.save()

    StockLedger.objects.create(
        item=txn.item,
        quantity=txn.quantity,
        transaction_type="IN",
        created_by=request.user
    )

    return Response({"message": "Completed"})


# =========================================================
# ITEM PROCESS
# =========================================================
class ItemProcessCreateView(generics.CreateAPIView):
    serializer_class = ItemProcessCreateUpdateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class DepartmentTransactionsByDeptView(generics.ListAPIView):
    serializer_class = DepartmentTransactionListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DepartmentTransaction.objects.filter(
            organization=self.request.user.organization
        )
        

class DepartmentTransactionCreateView(generics.CreateAPIView):
    serializer_class = DepartmentTransactionCreateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        item = serializer.validated_data.get("item")
        department = serializer.validated_data.get("current_department")
        qty = serializer.validated_data.get("quantity")

        # ✅ Check stock
        available_stock = item.get_department_stock(department.id)

        if qty > available_stock:
            raise ValidationError({
                "error": f"Not enough stock in {department.name}. Available: {available_stock}"
            })

        # ✅ Create transaction
        txn = serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user,
            status="in_progress",
            started_at=timezone.now()
        )

        # ✅ OUT entry (stock reduction)
        StockLedger.objects.create(
            item=item,
            quantity=qty,
            transaction_type="OUT",
            department=department,
            reference=f"Dept Issue #{txn.id}",
            created_by=self.request.user
        )
        
from datetime import date, timedelta

from datetime import date, timedelta

class PlannedOrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            data = request.data

            product = data.get("product")
            quantity = data.get("quantity")
            sales_orders = data.get("sales_orders", [])

            if not product or not quantity:
                return Response({"error": "Product and quantity required"}, status=400)

            # ✅ FIX: get latest plan instead of .get()
            production_plan = ProductionPlan.objects.filter(
                organization=request.user.organization
            ).order_by("-created_at").first()

            # ✅ If no plan exists → create one
            if not production_plan:
                production_plan = ProductionPlan.objects.create(
                    organization=request.user.organization,
                    name=f"Auto Plan - {date.today()}",
                    created_by=request.user
                )

            # ✅ Create planned order
            planned_order = PlannedOrder.objects.create(
                production_plan=production_plan,
                product_id=product,
                quantity=int(quantity),
                planned_start=date.today(),
                planned_finish=date.today() + timedelta(days=2),
                status="planned"
            )

            # ✅ Attach sales orders
            sales_orders = request.data.get("sales_orders", [])

            valid_sos = SalesOrder.objects.filter(id__in=sales_orders)

            planned_order.sales_orders.set(valid_sos)

            return Response({
                "id": planned_order.id
            }, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=400)
class ManufacturingOrderStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            mo = ManufacturingOrder.objects.get(
                id=pk,
                planned_order__production_plan__organization=request.user.organization
            )
        except ManufacturingOrder.DoesNotExist:
            return Response({"detail": "Manufacturing order not found"}, status=404)

        if mo.status != "draft":
            return Response({"detail": "Order already started or completed"}, status=400)

        mo.status = "in_progress"
        mo.start_date = request.data.get("start_date") or timezone.now().date()
        mo.save()

        return Response({"detail": "Production started"})


class ManufacturingOrderCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            mo = ManufacturingOrder.objects.get(
                id=pk,
                planned_order__production_plan__organization=request.user.organization
            )
        except ManufacturingOrder.DoesNotExist:
            return Response({"detail": "Manufacturing order not found"}, status=404)

        if mo.status != "in_progress":
            return Response({"detail": "Order must be in progress"}, status=400)

        mo.status = "done"
        mo.finish_date = request.data.get("finish_date") or timezone.now().date()
        mo.save()

        # Update stock
        item = mo.product
        item.current_stock = (Decimal(str(item.current_stock or '0')) + mo.quantity)
        item.save(update_fields=['current_stock'])

        return Response({"detail": "Production completed — finished goods stock updated"})
# Add this to the end of views.py
class MachineLoadView(APIView):
    """
    Get current load on machines from planned and manufacturing orders
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        org = request.user.organization
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date:
            start_date = timezone.now().date()
        if not end_date:
            end_date = start_date + timedelta(days=30)
            
        if isinstance(start_date, str):
            start_date = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
        if isinstance(end_date, str):
            end_date = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
            
        days_in_period = (end_date - start_date).days + 1
            
        # Get all machines (not work centers)
        machines = Machine.objects.filter(organization=org, is_active=True)
        
        result = []
        
        for machine in machines:
            # Calculate total capacity
            total_capacity = machine.get_effective_capacity(days=days_in_period)
            
            load_data = {
                'machine_id': machine.id,
                'machine_name': machine.name,
                'machine_code': machine.code,
                'work_center_type': machine.work_center_type,
                'maintenance_status': machine.maintenance_status,
                'capacity_per_day': float(machine.capacity_per_day_hours),
                'efficiency_percentage': float(machine.efficiency_percentage),
                'utilization_percentage': float(machine.utilization_percentage),
                'effective_capacity': total_capacity,
                'total_load': 0,
                'load_details': []
            }
            
            # Find all operations for this machine
            operations = RoutingOperation.objects.filter(
                machine=machine,
                routing__product__organization=org
            ).select_related('routing__product')
            
            for op in operations:
                # Find planned orders for this product
                planned_orders = PlannedOrder.objects.filter(
                    product=op.routing.product,
                    planned_start__lte=end_date,
                    planned_finish__gte=start_date,
                    status__in=['planned', 'confirmed']
                )
                
                for po in planned_orders:
                    # Calculate load
                    load_hours = float(op.expected_hours) * float(po.quantity)
                    load_data['total_load'] += load_hours
                    load_data['load_details'].append({
                        'planned_order_id': po.id,
                        'product': po.product.name,
                        'quantity': po.quantity,
                        'operation': op.operation_name,
                        'load_hours': round(load_hours, 2),
                        'start_date': po.planned_start,
                        'finish_date': po.planned_finish,
                        'scheduling_type': po.scheduling_type
                    })
            
            # Calculate utilization
            if total_capacity > 0:
                load_data['utilization_percentage'] = round(
                    (load_data['total_load'] / total_capacity) * 100, 2
                )
                load_data['remaining_capacity'] = round(total_capacity - load_data['total_load'], 2)
            else:
                load_data['utilization_percentage'] = 0
                load_data['remaining_capacity'] = 0
            
            result.append(load_data)
        
        # Sort by utilization
        result.sort(key=lambda x: x['utilization_percentage'], reverse=True)
        
        return Response(result)

# views.py - Simplified version

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

# ====================== PRODUCTION PLAN VIEWS ======================

class ProductionPlanAPIView(APIView):
    """Get production plans"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        organization = request.user.organization
        status_filter = request.query_params.getlist('status', [])
        
        queryset = ProductionPlan.objects.filter(organization=organization)
        if status_filter:
            queryset = queryset.filter(status__in=status_filter)
        
        # Get manufacturing orders for each plan
        data = []
        for plan in queryset:
            planned_orders = PlannedOrder.objects.filter(production_plan=plan)
            manufacturing_orders = ManufacturingOrder.objects.filter(planned_order__in=planned_orders)
            
            total_hours = sum(float(mo.required_hours or 0) for mo in manufacturing_orders)
            
            data.append({
                'id': plan.id,
                'name': str(plan),
                'status': plan.status,
                'created_at': plan.created_at,
                'order_count': manufacturing_orders.count(),
                'total_hours': round(total_hours, 2)
            })
        
        return Response(data)


class ProductionPlanDetailAPIView(APIView):
    """Get production plan details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        organization = request.user.organization
        plan = get_object_or_404(ProductionPlan, pk=pk, organization=organization)
        
        planned_orders = PlannedOrder.objects.filter(production_plan=plan)
        manufacturing_orders = ManufacturingOrder.objects.filter(planned_order__in=planned_orders)
        
        total_hours = sum(float(mo.required_hours or 0) for mo in manufacturing_orders)
        
        data = {
            'order_count': manufacturing_orders.count(),
            'total_hours': round(total_hours, 2),
            'products': [
                {
                    'name': mo.product.name,
                    'quantity': float(mo.quantity)
                }
                for mo in manufacturing_orders
            ]
        }
        
        return Response(data)


# ====================== MANUFACTURING ORDER VIEWS ======================

# =========================================================
# MANUFACTURING ORDERS
# =========================================================
# =========================================================
# MANUFACTURING ORDERS - FIXED VERSION
# =========================================================
class ManufacturingOrderListView(APIView):
    """List all manufacturing orders. Supports ?plan_id=xxx filter"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        organization = request.user.organization
        plan_id = request.query_params.get('plan_id')

        # Base queryset - Remove 'machine' from select_related since it doesn't exist
        queryset = ManufacturingOrder.objects.filter(
            planned_order__production_plan__organization=organization
        ).select_related('product', 'planned_order')   # ← Removed 'machine'

        if plan_id:
            queryset = queryset.filter(planned_order__production_plan_id=plan_id)

        # Build response manually to avoid serializer issues
        data = []
        for mo in queryset:
            data.append({
                'id': mo.id,
                'product': mo.product.name if mo.product else None,
                'product_id': mo.product.id if mo.product else None,
                'quantity': float(mo.quantity),
                'status': mo.status,
                'required_hours': float(getattr(mo, 'required_hours', 0) or 0),
                # Safe access for machine (in case the field exists later)
                'machine': getattr(mo, 'machine', None).name if getattr(mo, 'machine', None) else None,
                'machine_id': getattr(mo, 'machine', None).id if getattr(mo, 'machine', None) else None,
                'start_date': mo.start_date.isoformat() if mo.start_date else None,
                'finish_date': mo.finish_date.isoformat() if mo.finish_date else None,
            })
        
        return Response(data)
    
# ====================== UPDATE MANUFACTURING ORDER ======================
class ManufacturingOrderUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            mo = ManufacturingOrder.objects.get(
                id=pk,
                planned_order__production_plan__organization=request.user.organization
            )
        except ManufacturingOrder.DoesNotExist:
            return Response({"detail": "Manufacturing order not found"}, status=404)

        # Allow updating status, start_date, finish_date
        allowed_fields = ['status', 'start_date', 'finish_date']
        data = {}

        for field in allowed_fields:
            if field in request.data:
                data[field] = request.data[field]

        # Special handling for status change
        if 'status' in data:
            new_status = data['status']
            if new_status not in ['draft', 'in_progress', 'done']:
                return Response({"detail": "Invalid status"}, status=400)

            # Optional: Add business logic (e.g., only allow draft → in_progress)
            if mo.status == "done":
                return Response({"detail": "Cannot change completed order"}, status=400)

        # Update fields
        for field, value in data.items():
            setattr(mo, field, value)

        mo.save()

        return Response({
            "detail": "Manufacturing order updated successfully",
            "id": mo.id,
            "status": mo.status,
            "start_date": mo.start_date,
            "finish_date": mo.finish_date
        })

# ====================== MACHINE VIEWS ======================

class MachineAPIView(APIView):
    """Get available machines"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        organization = request.user.organization
        
        machines = Machine.objects.filter(
            organization=organization,
            is_active=True,
            maintenance_status='operational'
        )
        
        data = []
        for machine in machines:
            # Calculate current load
            current_orders = ManufacturingOrder.objects.filter(
                machine=machine,
                status__in=['in_progress']
            )
            current_load = sum(float(order.required_hours or 0) for order in current_orders)
            
            data.append({
                'id': machine.id,
                'name': machine.name,
                'code': machine.code,
                'work_center_type': machine.work_center_type,
                'work_center_type_display': machine.get_work_center_type_display(),
                'capacity_per_day_hours': float(machine.capacity_per_day_hours),
                'efficiency_percentage': float(machine.efficiency_percentage),
                'utilization_percentage': float(machine.utilization_percentage),
                'current_load_hours': round(current_load, 2)
            })
        
        return Response(data)


class MachineAvailabilityAPIView(APIView):
    """Check if machine is available for a date range"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, machine_id):
        organization = request.user.organization
        machine = get_object_or_404(Machine, id=machine_id, organization=organization)
        
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        required_hours = float(request.query_params.get('required_hours', 0))
        
        if not start_date or not end_date:
            return Response({'error': 'start_date and end_date required'}, status=400)
        
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format'}, status=400)
        
        # Calculate capacity
        days = (end - start).days + 1
        total_capacity = float(machine.capacity_per_day_hours) * days
        
        # Get existing assignments
        existing_orders = ManufacturingOrder.objects.filter(
            machine=machine,
            start_date__lte=end,
            finish_date__gte=start,
            status__in=['draft', 'in_progress']
        )
        
        assigned_hours = sum(float(order.required_hours or 0) for order in existing_orders)
        available_capacity = total_capacity - assigned_hours
        
        available = required_hours <= available_capacity
        
        return Response({
            'available': available,
            'available_capacity': round(available_capacity, 2),
            'required_hours': round(required_hours, 2),
            'remaining_capacity': round(available_capacity - required_hours, 2) if available else 0,
            'reason': f'Available: {available_capacity:.1f} hrs, Required: {required_hours:.1f} hrs' if not available else None
        })


class MachineSuggestDatesAPIView(APIView):
    """Suggest best dates for machine assignment"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, machine_id):
        organization = request.user.organization
        machine = get_object_or_404(Machine, id=machine_id, organization=organization)
        
        required_hours = float(request.query_params.get('required_hours', 0))
        
        if required_hours <= 0:
            return Response({
                'suggested_start_date': (timezone.now().date() + timedelta(days=1)).isoformat(),
                'suggested_end_date': (timezone.now().date() + timedelta(days=1)).isoformat(),
                'days_needed': 1
            })
        
        # Start from tomorrow
        start_date = timezone.now().date() + timedelta(days=1)
        daily_capacity = float(machine.capacity_per_day_hours)
        
        if daily_capacity <= 0:
            daily_capacity = 8  # Default 8 hours if not set
        
        days_needed = max(1, int(required_hours / daily_capacity) + 1)
        
        # Find first available slot
        current_date = start_date
        available_days = 0
        
        for _ in range(30):  # Check next 30 days
            # Check if machine is free on this day
            orders_on_day = ManufacturingOrder.objects.filter(
                machine=machine,
                start_date__lte=current_date,
                finish_date__gte=current_date,
                status__in=['draft', 'in_progress']
            )
            
            if orders_on_day.count() == 0:  # Free day
                available_days += 1
                if available_days >= days_needed:
                    end_date = current_date
                    break
            else:
                available_days = 0
            
            current_date += timedelta(days=1)
        
        end_date = start_date + timedelta(days=days_needed - 1)
        
        return Response({
            'suggested_start_date': start_date.isoformat(),
            'suggested_end_date': end_date.isoformat(),
            'days_needed': days_needed
        })


# ====================== ASSIGN MACHINE VIEW ======================

class AssignMachineAPIView(APIView):
    """Assign machine to manufacturing order"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, plan_id):
        organization = request.user.organization
        plan = get_object_or_404(ProductionPlan, pk=plan_id, organization=organization)
        
        machine_id = request.data.get('machine_id')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        
        if not machine_id:
            return Response({'message': 'Machine ID required'}, status=400)
        
        machine = get_object_or_404(Machine, id=machine_id, organization=organization)
        
        # Get all manufacturing orders for this plan
        planned_orders = PlannedOrder.objects.filter(production_plan=plan)
        manufacturing_orders = ManufacturingOrder.objects.filter(
            planned_order__in=planned_orders,
            status='draft'
        )
        
        if not manufacturing_orders.exists():
            return Response({
                'message': f'No manufacturing orders found for plan #{plan_id}'
            }, status=400)
        
        # Calculate total hours
        total_hours = sum(float(mo.required_hours or 0) for mo in manufacturing_orders)
        
        # Parse dates
        if start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
        else:
            start = timezone.now().date()
        
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            # Calculate end date based on capacity
            daily_capacity = float(machine.capacity_per_day_hours)
            days_needed = max(1, int(total_hours / daily_capacity) + 1) if daily_capacity > 0 else 1
            end = start + timedelta(days=days_needed - 1)
        
        # Check availability
        days = (end - start).days + 1
        total_capacity = float(machine.capacity_per_day_hours) * days
        
        existing_orders = ManufacturingOrder.objects.filter(
            machine=machine,
            start_date__lte=end,
            finish_date__gte=start,
            status__in=['draft', 'in_progress']
        ).exclude(id__in=[mo.id for mo in manufacturing_orders])
        
        assigned_hours = sum(float(order.required_hours or 0) for order in existing_orders)
        available_capacity = total_capacity - assigned_hours
        
        if total_hours > available_capacity:
            return Response({
                'message': f'Insufficient capacity. Available: {available_capacity:.1f} hrs, Required: {total_hours:.1f} hrs'
            }, status=400)
        
        # Assign machine to all manufacturing orders
        for mo in manufacturing_orders:
            mo.machine = machine
            mo.start_date = start
            mo.finish_date = end
            mo.status = 'in_progress'
            mo.save()
        
        return Response({
            'message': f'Machine assigned to {manufacturing_orders.count()} manufacturing orders',
            'plan_id': plan.id,
            'machine': machine.name,
            'start_date': start.isoformat(),
            'end_date': end.isoformat(),
            'total_hours': round(total_hours, 2)
        })

from .services import ProductionService
class DraftManufacturingOrdersAPIView(APIView):
    def get(self, request):
        orders = ProductionService.get_draft_manufacturing_orders()
        serializer = ManufacturingOrderSerializer(orders, many=True)
        return Response(serializer.data)


class AvailableMachinesAPIView(APIView):
    def get(self, request):
        machines = Machine.objects.filter(maintenance_status='operational', is_active=True)
        serializer = MachineSerializer(machines, many=True)
        return Response(serializer.data)


class AssignMachinesAPIView(APIView):
    def post(self, request):
        order_id = request.data.get('manufacturing_order_id')
        machine_id = request.data.get('machine_id')   # New

        count, message = ProductionService.assign_machines_and_create_workorders(order_id, machine_id)

        if count > 0:
            return Response({"success": True, "message": message, "created_count": count})
        return Response({"success": False, "message": message}, status=400)

class MachineAvailabilityCheckAPIView(APIView):
    def get(self, request):
        machine_id = request.query_params.get('machine_id')
        order_id = request.query_params.get('manufacturing_order_id')  # optional, for better estimation

        if not machine_id:
            return Response({"error": "machine_id is required"}, status=400)

        try:
            machine = Machine.objects.get(id=machine_id)
        except Machine.DoesNotExist:
            return Response({"error": "Machine not found"}, status=404)

        # For simplicity, use today's date + estimated days (or fetch from order)
        proposed_start = timezone.now().date()
        proposed_end = proposed_start + timedelta(days=10)  # fallback

        if order_id:
            try:
                mo = ManufacturingOrder.objects.get(id=order_id, status='draft')
                # Reuse your calculation logic here if needed
                proposed_start = mo.start_date or proposed_start
                # ... calculate proposed_end similarly
            except:
                pass

        busy_info = ProductionService.get_machine_busy_info(machine, proposed_start, proposed_end)

        return Response({
            "machine_id": machine.id,
            "machine_name": machine.name,
            "is_available": not busy_info['is_busy'],
            **busy_info
        })        
    
# apps/production/views.py

from collections import defaultdict
from decimal import Decimal
from datetime import timedelta, date
import math

from django.utils import timezone
from django.db.models import Sum, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import (
    ProductionPlan, PlannedOrder, PurchaseRequisition,
    BillOfMaterial, Routing, RoutingOperation
)
from apps.inventory.models import Item, StockLedger, ItemDependency
from apps.sales.models import SalesOrder, SalesOrderItem


def get_stock_on_hand(item: Item) -> Decimal:
    """Real stock from StockLedger (IN - OUT - ADJ negative)"""
    aggregates = StockLedger.objects.filter(item=item).aggregate(
        total_in=Sum('quantity', filter=Q(transaction_type='IN')),
        total_out=Sum('quantity', filter=Q(transaction_type='OUT')),
        total_adj=Sum('quantity', filter=Q(transaction_type='ADJ')),
    )
    
    in_total  = aggregates['total_in']  or Decimal('0')
    out_total = aggregates['total_out'] or Decimal('0')
    adj_total = aggregates['total_adj'] or Decimal('0')
    
    return Decimal(in_total + adj_total - out_total)


def explode_bom(product_id: int, qty: Decimal, demand_dict: dict):
    """Recursive BOM explosion – accumulates gross dependent demand"""
    demand_dict[product_id] = demand_dict.get(product_id, Decimal('0')) + qty
    
    bom = BillOfMaterial.objects.filter(
        product_id=product_id,
        is_active=True
    ).order_by('-created_at').first()  # latest active version
    
    if not bom:
        return
    
    for line in bom.lines.all():
        component_qty = qty * line.quantity
        explode_bom(line.component_id, component_qty, demand_dict)
# Add this at the top of apps/production/views.py (after imports)
from decimal import Decimal
from django.db.models import Sum, Q
from apps.inventory.models import StockLedger

def get_stock_on_hand(item: Item) -> Decimal:
    """Calculate real available stock from StockLedger"""
    aggregates = StockLedger.objects.filter(item=item).aggregate(
        total_in=Sum('quantity', filter=Q(transaction_type='IN')),
        total_out=Sum('quantity', filter=Q(transaction_type='OUT')),
        total_adj=Sum('quantity', filter=Q(transaction_type='ADJ')),
    )
    
    in_total = aggregates['total_in'] or Decimal('0')
    out_total = aggregates['total_out'] or Decimal('0')
    adj_total = aggregates['total_adj'] or Decimal('0')
    
    return Decimal(in_total + adj_total - out_total)


def get_bom_status(product, qty):
    """
    Returns BOM status using your actual ItemDependency model
    """
    # Get all dependent items (components) for this product
    dependencies = ItemDependency.objects.filter(
        parent_item=product
    ).select_related('child_item')

    if not dependencies.exists():
        return []  # No dependent items

    result = []

    for dep in dependencies:
        required = Decimal(str(qty)) * dep.quantity

        # Current stock
        stock = get_stock_on_hand(dep.child_item)

        # Open planned orders for this component
        planned = PlannedOrder.objects.filter(
            product=dep.child_item,
            status__in=["planned", "confirmed"]
        ).aggregate(total=Sum("quantity"))["total"] or Decimal('0')

        shortage = required - (stock + planned)

        result.append({
            "component": dep.child_item.name,
            "component_code": dep.child_item.code,
            "required": float(required),
            "stock": float(stock),
            "planned": float(planned),
            "shortage": float(max(shortage, 0)),
            "uom": dep.child_item.uom
        })

    return result
def calculate_operation_time(product: Item, qty: Decimal) -> Decimal:
    """Estimate total production time in hours from routing"""
    routing = Routing.objects.filter(product=product, is_active=True).first()
    if not routing:
        return Decimal('8') * 3  # fallback 3 days × 8h
    
    total_hours = Decimal('0')
    for op in routing.operations.all().order_by('sequence'):
        if op.expected_hours:
            total_hours += op.expected_hours * qty
        # You can add setup + queue time from machine here later
    
    return total_hours


def get_planned_dates(
    item: Item,
    qty: Decimal,
    ref_date: date,
    scheduling_type: str = 'lead_time'
) -> tuple[date, date]:
    """
    Returns (planned_start, planned_finish)
    Backward scheduling is used (finish date first)
    """
    if scheduling_type == 'basic_dates':
        days = item.fixed_lead_time_days or 7
        finish = ref_date + timedelta(days=days)
        start = finish - timedelta(days=days)
        return start, finish

    # Lead time scheduling – based on routing time
    total_hours = calculate_operation_time(item, qty)
    
    # Assume 8 productive hours per day
    productive_days = math.ceil(total_hours / Decimal('8'))
    
    # Add safety buffer (queue/setup/inspection)
    buffer_days = 2
    
    finish = ref_date + timedelta(days=buffer_days)  # need-by date
    start = finish - timedelta(days=productive_days + buffer_days)
    
    return max(start, ref_date), finish


class RunMRPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org = request.user.organization
        ref_date = timezone.now().date()  # MRP reference date

        # 1. Check if there is anything to plan
        if not SalesOrder.objects.filter(
            organization=org,
            status='approved'
        ).exists():
            return Response({"detail": "No approved sales orders found"}, status=400)

        # 2. Create MRP run header
        plan = ProductionPlan.objects.create(
            organization=org,
            created_by=request.user,
            planned_date=ref_date,
            status="mrp_done"
        )

        # 3. Collect top-level demand (sales orders)
        top_demand = SalesOrderItem.objects.filter(
            sales_order__organization=org,
            sales_order__status='approved'
        ).values('product_id').annotate(
            total_demand=Sum('quantity')
        )

        # 4. Explode BOM → get gross requirements for all levels
        gross_requirements = defaultdict(Decimal)
        for row in top_demand:
            explode_bom(row['product_id'], row['total_demand'] or Decimal('0'), gross_requirements)

        # 5. Netting + proposal generation
        created_planned = 0
        created_requisitions = 0

        for product_id, gross_qty in gross_requirements.items():
            try:
                product = Item.objects.get(id=product_id, organization=org)
            except Item.DoesNotExist:
                continue

            # ── Supply ───────────────────────────────────────
            on_hand = get_stock_on_hand(product)

            # Open planned orders (not yet converted)
            open_planned = PlannedOrder.objects.filter(
                product=product,
                production_plan__organization=org,
                status__in=['planned', 'confirmed']
            ).aggregate(total=Sum('quantity'))['total'] or Decimal('0')

            # Open manufacturing orders (released but not finished)
            open_mo = ManufacturingOrder.objects.filter(
                product=product,
                status__in=['in_progress']
            ).aggregate(total=Sum('quantity'))['total'] or Decimal('0')

            total_supply = on_hand + open_planned + open_mo

            # ── Net Requirement ──────────────────────────────
            net_qty = max(Decimal('0'), gross_qty - total_supply)

            if net_qty <= 0:
                continue  # covered by stock / open supply

            # ── Decide make or buy ───────────────────────────
            has_active_bom = BillOfMaterial.objects.filter(
                product=product,
                is_active=True
            ).exists()

            # ── Scheduling type ──────────────────────────────
            scheduling = 'lead_time' if has_active_bom else 'basic_dates'

            # ── Calculate dates (backward scheduling) ────────
            start_date, finish_date = get_planned_dates(
                product, net_qty, ref_date, scheduling
            )

            # ── Create proposal ──────────────────────────────
            if has_active_bom:
                # Manufactured item → Planned Order
                PlannedOrder.objects.create(
                    production_plan=plan,
                    product=product,
                    quantity=net_qty,
                    planned_start=start_date,
                    planned_finish=finish_date,
                    scheduling_type='production',
                    status='planned'
                )
                created_planned += 1
            else:
                # Purchased / raw material → Purchase Requisition
                PurchaseRequisition.objects.create(
                    production_plan=plan,
                    material=product,
                    quantity=net_qty,
                    required_date=finish_date,
                    status='open'
                )
                created_requisitions += 1

        msg = (
            f"MRP completed. "
            f"Planned orders: {created_planned} | "
            f"Purchase requisitions: {created_requisitions}"
        )

        if created_planned + created_requisitions == 0:
            msg += " (all demand covered by stock/open orders)"

        return Response({
            "detail": msg,
            "production_plan_id": plan.id,
            "reference_date": ref_date.isoformat(),
            "gross_items": len(gross_requirements),
            "net_items_with_requirement": created_planned + created_requisitions
        }, status=status.HTTP_201_CREATED)

# apps/production/views.py

# apps/production/views.py

class RunSingleItemMRPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):        # ← Add 'pk' here
        org = request.user.organization
        ref_date = timezone.now().date()

        try:
            product = Item.objects.get(id=pk, organization=org)
        except Item.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

        # 1. Calculate net requirement from approved sales orders
        sales_items = SalesOrderItem.objects.filter(
            product=product,
            sales_order__status="approved",
            sales_order__organization=org
        ).select_related('sales_order')

        demand = sales_items.aggregate(total=Sum("quantity"))["total"] or Decimal('0')
        stock = get_stock_on_hand(product)

        planned_qty = PlannedOrder.objects.filter(
            product=product,
            status__in=["planned", "confirmed"]
        ).aggregate(total=Sum("quantity"))["total"] or Decimal('0')

        required = Decimal(str(demand)) - Decimal(str(stock)) - Decimal(str(planned_qty))

        if required <= 0:
            return Response({"detail": "No additional production required"}, status=200)

        # 2. Check for material shortages
        bom_details = get_bom_status(product, required)
        has_shortage = any(float(item.get('shortage', 0)) > 0 for item in bom_details)

        if has_shortage:
            return Response({
                "detail": "Cannot create Production Order - Material shortage detected",
                "has_shortage": True,
                "shortages": [d for d in bom_details if float(d.get('shortage', 0)) > 0]
            }, status=400)

        # 3. Get or create Production Plan
        production_plan = ProductionPlan.objects.filter(
            organization=org
        ).order_by("-created_at").first()

        if not production_plan:
            production_plan = ProductionPlan.objects.create(
                organization=org,
                created_by=request.user,
                planned_date=ref_date,
                status="mrp_done"
            )

        # 4. Create Planned Order
        planned_order = PlannedOrder.objects.create(
            production_plan=production_plan,
            product=product,
            quantity=required,
            planned_start=ref_date,
            planned_finish=ref_date + timedelta(days=5),
            status="planned",
            scheduling_type="production"
        )

        # Link to Sales Orders
        so_ids = [item.sales_order_id for item in sales_items]
        planned_order.sales_orders.set(so_ids)

        # 5. Create ManufacturingOrder (This is your Production Order)
        manufacturing_order = ManufacturingOrder.objects.create(
            planned_order=planned_order,
            product=product,
            quantity=required,
            status="draft",
            start_date=ref_date,
        )
        routing = Routing.objects.filter(product=product, is_active=True).first()
        if routing:
            for op in routing.operations.all().order_by('sequence'):
                MOOperation.objects.create(
                    manufacturing_order=manufacturing_order,
                    machine=op.machine,
                    operation_name=op.operation_name,
                    sequence=op.sequence,
                    status="pending"
                )

        # Mark planned order as converted
        planned_order.status = "converted"
        planned_order.save()

        return Response({
            "success": True,
            "detail": f"Production Order created successfully for {product.name}",
            "planned_order_id": planned_order.id,
            "manufacturing_order_id": manufacturing_order.id,
            "quantity": float(required),
            "linked_sales_order_ids": so_ids
        }, status=201)
# ====================== WORK ORDERS ======================

class WorkOrderListView(APIView):
    """List Work Orders with Pending / Completed tabs"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization = request.user.organization
        status_filter = request.query_params.get('status', 'pending')

        queryset = ManufacturingOrder.objects.filter(
            planned_order__production_plan__organization=organization
        ).select_related('product', 'planned_order')

        if status_filter == 'pending':
            queryset = queryset.filter(status__in=['draft', 'in_progress'])
        elif status_filter == 'completed':
            queryset = queryset.filter(status='done')

        data = []
        for wo in queryset:
            data.append({
                'id': wo.id,
                'product': wo.product.name if wo.product else None,
                'machine_name': getattr(wo, 'machine', None).name if getattr(wo, 'machine', None) else None,
                'start_date': wo.start_date.isoformat() if wo.start_date else None,
                'end_date': wo.finish_date.isoformat() if wo.finish_date else None,
                'sales_order_id': wo.planned_order.sales_orders.first().id if wo.planned_order.sales_orders.exists() else None,
                'quantity': float(wo.quantity),
                'department': 'Production',  # You can enhance this later
                'status': wo.status,
            })

        return Response(data)


class WorkOrderActionView(APIView):
    """Approve or Reject Work Order"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            wo = ManufacturingOrder.objects.get(
                id=pk,
                planned_order__production_plan__organization=request.user.organization
            )
        except ManufacturingOrder.DoesNotExist:
            return Response({"detail": "Work order not found"}, status=404)

        new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({"detail": "Invalid status. Use 'approved' or 'rejected'"}, status=400)

        if wo.status == 'done':
            return Response({"detail": "Cannot change completed work order"}, status=400)

        wo.status = 'done' if new_status == 'approved' else 'rejected'
        wo.save()

        return Response({
            "detail": f"Work order #{pk} has been {new_status}.",
            "id": wo.id,
            "status": wo.status
        })