# apps/production/views.py
from collections import defaultdict
from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db.models import DecimalField
from django.db.models import Sum, Q, Value
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import (
    ProductionPlan, PlannedOrder, PurchaseRequisition,
    ManufacturingOrder, MOOperation,
    BillOfMaterial, Routing, RoutingOperation, WorkCenter
)
from .serializers import (
    ProductionPlanSerializer, PlannedOrderSerializer,
    PurchaseRequisitionSerializer, ManufacturingOrderSerializer
)
from apps.inventory.models import Item, StockLedger
from apps.sales.models import SalesOrderItem


# ────────────────────────────────────────────────
# ITEM SALES SUMMARY (for MRP Planning Board)
# ────────────────────────────────────────────────
class ItemSalesSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = (
            SalesOrderItem.objects
            .filter(sales_order__organization=request.user.organization)
            .select_related("product")
            .values(
                "product__id",
                "product__name",
                "product__code",
                "product__uom"
            )
            .annotate(
                total_sales_qty=Sum("quantity"),
                sales_orders=ArrayAgg(
                    "sales_order__order_number",
                    distinct=True,
                    ordering="sales_order__order_number"
                ),
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
            total_demand = float(row["total_sales_qty"] or 0)
            stock = float(row["current_stock"] or 0)
            row["required_production"] = max(0, total_demand - stock)
            result.append(row)

        return Response(result)


# ────────────────────────────────────────────────
# PRODUCTION PLAN - LIST & CREATE
# ────────────────────────────────────────────────
class ProductionPlanListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = ProductionPlan.objects.filter(
            organization=request.user.organization
        ).select_related("sales_order", "created_by").order_by("-created_at")
        serializer = ProductionPlanSerializer(plans, many=True)
        return Response(serializer.data)


class ProductionPlanCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ProductionPlanSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                organization=request.user.organization,
                created_by=request.user
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ────────────────────────────────────────────────
# MRP RUN - IMPROVED MULTI-LEVEL + MAKE/BUY + SCHEDULING
# ────────────────────────────────────────────────
class RunMRPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org = request.user.organization
        today = timezone.now().date()
        scheduling_mode = request.data.get("scheduling_mode", "basic")  # or "leadtime"

        plan = ProductionPlan.objects.create(
            organization=org,
            created_by=request.user,
            planned_date=today,
            status="mrp_done"
        )

        # 1. Top-level demand from open sales orders
        demand_qs = SalesOrderItem.objects.filter(
            sales_order__organization=org,
            sales_order__status__in=["open", "confirmed"]  # adjust statuses
        ).values("product_id").annotate(gross_demand=Sum("quantity"))

        net_requirements = defaultdict(Decimal)
        warnings = []

        def explode_bom(product_id, gross_qty, level=0):
            try:
                item = Item.objects.get(id=product_id, organization=org)
            except Item.DoesNotExist:
                return

            available = Decimal(str(getattr(item, 'current_stock', 0) or 0))
            net_req = max(Decimal('0'), gross_qty - available)

            if net_req <= 0:
                return

            net_requirements[product_id] += net_req

            if getattr(item, 'procurement_type', 'F') == 'E':  # Manufactured
                bom = BillOfMaterial.objects.filter(
                    product=item, is_active=True
                ).order_by('-created_at').first()
                if bom:
                    for line in bom.lines.all():
                        comp_qty = line.quantity * net_req
                        explode_bom(line.component.id, comp_qty, level + 1)

        # Start explosion
        for row in demand_qs:
            prod_id = row["product_id"]
            gross = row["gross_demand"] or Decimal('0')
            explode_bom(prod_id, gross)

        # 2. Create proposals
        created_planned = 0
        created_req = 0

        for item_id, net_qty in net_requirements.items():
            if net_qty <= 0:
                continue
            try:
                item = Item.objects.get(id=item_id, organization=org)
            except Item.DoesNotExist:
                continue

            if getattr(item, 'procurement_type', 'F') == 'E':
                start, finish = self.calculate_dates(item, net_qty, today, scheduling_mode)
                PlannedOrder.objects.create(
                    production_plan=plan,
                    product=item,
                    quantity=net_qty,
                    planned_start=start,
                    planned_finish=finish,
                    scheduling_type=scheduling_mode,
                    status="planned"
                )
                created_planned += 1

                if scheduling_mode == "leadtime":
                    load_warnings = self.estimate_capacity_load(item, net_qty)
                    warnings.extend(load_warnings)
            else:
                req_date = today + timedelta(days=getattr(item, 'planned_delivery_time_days', 7) or 7)
                PurchaseRequisition.objects.create(
                    production_plan=plan,
                    material=item,
                    quantity=net_qty,
                    required_date=req_date,
                    status="open"
                )
                created_req += 1

        msg = f"MRP completed – {created_planned} planned orders + {created_req} purchase requisitions"
        if warnings:
            msg += " (with capacity warnings)"

        return Response({
            "detail": msg,
            "production_plan_id": plan.id,
            "warnings": warnings
        }, status=status.HTTP_201_CREATED)

    def calculate_dates(self, item, qty, ref_date, mode):
        if mode == "leadtime":
            routing = Routing.objects.filter(product=item, is_active=True).first()
            if routing and routing.operations.exists():
                total_hours = Decimal('0')
                for op in routing.operations.all():
                    total_hours += op.setup_time_hours + (
                        (op.machine_time_per_unit + op.labor_time_per_unit) * qty
                    )
                days_needed = (total_hours / Decimal('8.0')).to_integral_value() + 1
                finish = ref_date + timedelta(days=int(days_needed))
                start = finish - timedelta(days=int(days_needed - 1))
                return start, finish

        # Basic / fallback
        days = getattr(item, 'inhouse_production_days' if getattr(item, 'procurement_type', 'F') == 'E' else 'planned_delivery_time_days', 7) or 7
        finish = ref_date + timedelta(days=days)
        start = ref_date
        return start, finish

    def estimate_capacity_load(self, item, qty):
        warnings = []
        routing = Routing.objects.filter(product=item, is_active=True).first()
        if not routing:
            return warnings

        for op in routing.operations.all():
            if not op.work_center:
                continue
            load_hours = op.setup_time_hours + (
                (op.machine_time_per_unit + op.labor_time_per_unit) * qty
            )
            wc = op.work_center
            capacity = wc.capacity_per_day_hours * wc.number_of_machines * (wc.efficiency_percentage / Decimal('100'))
            if load_hours > capacity * Decimal('1.2'):  # 20% overload threshold
                warnings.append(
                    f"Capacity overload warning: {item.name} on {wc.name} "
                    f"({load_hours:.1f}h > {capacity:.1f}h effective)"
                )
        return warnings


# ────────────────────────────────────────────────
# Other views (kept mostly as-is, minor cleanups)
# ────────────────────────────────────────────────
# apps/production/views.py — add at the bottom

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
class PlannedOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = PlannedOrder.objects.filter(
            production_plan__organization=request.user.organization
        ).select_related("product", "production_plan").order_by("-planned_start")
        serializer = PlannedOrderSerializer(orders, many=True)
        return Response(serializer.data)


class ConvertToMOView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            planned = PlannedOrder.objects.get(
                id=pk,
                production_plan__organization=request.user.organization
            )
        except PlannedOrder.DoesNotExist:
            return Response({"detail": "Planned order not found"}, status=404)

        if planned.status == "converted":
            return Response({"detail": "Already converted"}, status=400)

        mo = ManufacturingOrder.objects.create(
            planned_order=planned,
            product=planned.product,
            quantity=planned.quantity,
            status="draft"
        )

        # Optional: copy routing to MO operations
        routing = Routing.objects.filter(product=planned.product, is_active=True).first()
        if routing:
            for op in routing.operations.all():
                MOOperation.objects.create(
                    manufacturing_order=mo,
                    work_center=op.work_center,
                    operation_name=op.operation_name,
                    sequence=op.sequence,
                    status="pending"
                )

        planned.status = "converted"
        planned.save()

        return Response({
            "detail": "Converted to Manufacturing Order",
            "mo_id": mo.id
        }, status=201)


class ManufacturingOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = ManufacturingOrder.objects.filter(
            planned_order__production_plan__organization=request.user.organization
        ).select_related("product", "planned_order").order_by("-id")
        serializer = ManufacturingOrderSerializer(orders, many=True)
        return Response(serializer.data)


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

class ProductionDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.user.organization
        data = {
            "production_plans": ProductionPlan.objects.filter(organization=org).count(),
            "planned_orders": PlannedOrder.objects.filter(
                production_plan__organization=org
            ).count(),
            "running_production": ManufacturingOrder.objects.filter(
                planned_order__production_plan__organization=org,
                status="in_progress"
            ).count(),
            "completed_production": ManufacturingOrder.objects.filter(
                planned_order__production_plan__organization=org,
                status="done"
            ).count(),
        }
        return Response(data)
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import ItemProcess, DepartmentTransaction
from .serializers import (
    ItemProcessSerializer,
    ItemProcessCreateUpdateSerializer,
    DepartmentTransactionListSerializer,
    DepartmentTransactionCreateSerializer
)

from rest_framework.decorators import api_view

@api_view(["PATCH"])
def start_transaction(request, pk):
    txn = DepartmentTransaction.objects.get(id=pk)

    txn.status = "in_progress"
    txn.started_at = timezone.now()
    txn.save()

    return Response({"message": "Started"})
from apps.inventory.models import StockLedger

@api_view(["PATCH"])
def complete_transaction(request, pk):
    txn = DepartmentTransaction.objects.get(id=pk)

    txn.status = "completed"
    txn.completed_at = timezone.now()
    txn.save()

    current_step = txn.process_step

    next_step = ItemProcessStep.objects.filter(
        process=current_step.process,
        sequence__gt=current_step.sequence
    ).order_by("sequence").first()

    if next_step:
        # ✅ Move to next department
        DepartmentTransaction.objects.create(
            organization=txn.organization,
            manufacturing_order=txn.manufacturing_order,
            process_step=next_step,
            current_department=next_step.department,
            item=txn.item,
            quantity=txn.quantity,
            status="pending"
        )

        # ✅ IN entry for next department
        StockLedger.objects.create(
            item=txn.item,
            quantity=txn.quantity,
            transaction_type="IN",
            department=next_step.department,
            reference=f"Transfer from {txn.current_department.name}",
            created_by=request.user
        )

    else:
        # ✅ Final step → Finished Goods
        StockLedger.objects.create(
            item=txn.item,
            quantity=txn.quantity,
            transaction_type="IN",
            department=None,
            reference="Production Completed",
            created_by=request.user
        )

    return Response({"message": "Completed"})
class ItemProcessCreateView(generics.CreateAPIView):
    queryset = ItemProcess.objects.none()
    serializer_class = ItemProcessCreateUpdateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ItemProcess.objects.filter(organization=self.request.user.organization)

    # def perform_create(self, serializer):
    #     serializer.save(organization=self.request.user.organization)


class DepartmentTransactionsByDeptView(generics.ListAPIView):
    serializer_class = DepartmentTransactionListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        dept_id = self.kwargs.get("dept_id")
        return DepartmentTransaction.objects.filter(
            organization=self.request.user.organization,
            current_department_id=dept_id,
            status__in=["pending", "in_progress"]
        ).select_related("item", "current_department", "next_department")


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
        
