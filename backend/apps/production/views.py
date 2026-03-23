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

from .models import (
    ProductionPlan, PurchaseRequisition,
    ManufacturingOrder, MOOperation,
    BillOfMaterial, Routing, RoutingOperation,
    PlannedOrder, ItemProcess, ItemProcessStep,
    DepartmentTransaction
)

from .serializers import (
    ProductionPlanSerializer, PlannedOrderSerializer,
    PurchaseRequisitionSerializer, ManufacturingOrderSerializer,
    ItemProcessSerializer, ItemProcessCreateUpdateSerializer,
    DepartmentTransactionListSerializer, DepartmentTransactionCreateSerializer
)

from apps.inventory.models import Item, StockLedger, Machine
from apps.sales.models import SalesOrder, SalesOrderItem


# =========================================================
# ITEM SALES SUMMARY
# =========================================================
class ItemSalesSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = (
            SalesOrderItem.objects
            .filter(sales_order__organization=request.user.organization)
            .select_related("product")
            .values("product__id", "product__name", "product__code", "product__uom")
            .annotate(
                total_sales_qty=Sum("quantity"),
                sales_orders=ArrayAgg("sales_order__order_number", distinct=True),
                current_stock=Coalesce(
                    Sum(
                        "product__grnitem__received_qty",
                        filter=Q(product__grnitem__grn__status="approved"),
                        output_field=DecimalField()
                    ),
                    Value(0, output_field=DecimalField())
                )
            )
            .order_by("-total_sales_qty")
        )

        result = []
        for row in data:
            demand = float(row["total_sales_qty"] or 0)
            stock = float(row["current_stock"] or 0)
            row["required_production"] = max(0, demand - stock)
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
class RunMRPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org = request.user.organization
        today = timezone.now().date()

        sales_orders = SalesOrder.objects.filter(organization=org, status='approved')

        if not sales_orders.exists():
            return Response({"detail": "No confirmed sales orders"}, status=400)

        plan = ProductionPlan.objects.create(
            organization=org,
            created_by=request.user,
            planned_date=today,
            status="mrp_done"
        )
        plan.sales_orders.set(sales_orders)

        demand_qs = SalesOrderItem.objects.filter(
            sales_order__organization=org,
            sales_order__status='approved'
        ).values("product_id").annotate(total_demand=Sum("quantity"))

        dependent_demands = defaultdict(Decimal)

        def explode(product_id, qty):
            dependent_demands[product_id] += qty
            bom = BillOfMaterial.objects.filter(product_id=product_id, is_active=True).first()
            if bom:
                for line in bom.lines.all():
                    explode(line.component_id, qty * line.quantity)

        for row in demand_qs:
            explode(row["product_id"], row["total_demand"] or 0)

        for pid, qty in dependent_demands.items():
            product = Item.objects.get(id=pid)
            has_bom = BillOfMaterial.objects.filter(product=product, is_active=True).exists()

            PlannedOrder.objects.create(
                production_plan=plan,
                product=product,
                quantity=qty,
                planned_start=today,
                planned_finish=today + timedelta(days=7),
                scheduling_type='production' if has_bom else 'purchase'
            )

        return Response({"detail": "MRP completed"}, status=201)


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
        ).select_related("product", "production_plan")

        return Response(PlannedOrderSerializer(orders, many=True).data)


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
class ManufacturingOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = ManufacturingOrder.objects.filter(
            planned_order__production_plan__organization=request.user.organization
        ).select_related("product", "planned_order")

        return Response(ManufacturingOrderSerializer(orders, many=True).data)


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
        
class PlannedOrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product")
        quantity = request.data.get("quantity")

        if not product_id or not quantity:
            return Response({"error": "product and quantity are required"}, status=400)

        try:
            qty = Decimal(str(quantity))
            if qty <= 0:
                raise ValueError
        except:
            return Response({"error": "Invalid quantity"}, status=400)

        try:
            product = Item.objects.get(id=product_id, organization=request.user.organization)
        except Item.DoesNotExist:
            return Response({"error": "Product not found"}, status=404)

        plan, _ = ProductionPlan.objects.get_or_create(
            organization=request.user.organization,
            status="planned",
            defaults={
                'created_by': request.user,
                'planned_date': timezone.now().date(),
            }
        )

        po = PlannedOrder.objects.create(
            production_plan=plan,
            product=product,
            quantity=qty,
            planned_start=timezone.now().date(),
            planned_finish=timezone.now().date() + timedelta(days=7),
            status="planned"
        )

        return Response(PlannedOrderSerializer(po).data, status=201)
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