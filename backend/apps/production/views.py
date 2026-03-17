# apps/production/views.py

from collections import defaultdict
from decimal import Decimal
from datetime import timedelta
from django.db.models import DecimalField
from django.db.models import Sum, Count, Q, Value
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import (
    ProductionPlan, PlannedOrder, ManufacturingOrder,
    BillOfMaterial, Routing, RoutingOperation, WorkCenter
)
from .serializers import (
    ProductionPlanSerializer, PlannedOrderSerializer,
    ManufacturingOrderSerializer
)
from apps.inventory.models import Item
from apps.sales.models import SalesOrderItem



# =========================================================
# ITEM SALES SUMMARY - MRP Dashboard Data
# =========================================================
class ItemSalesSummaryView(APIView):
    """
    Returns demand vs stock per product for MRP planning board
    """
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
                sales_order_count=Count("sales_order", distinct=True),
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


# =========================================================
# PRODUCTION PLAN - CREATE & LIST
# =========================================================
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


class ProductionPlanListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = ProductionPlan.objects.filter(
            organization=request.user.organization
        ).select_related("sales_order", "created_by").order_by("-created_at")

        serializer = ProductionPlanSerializer(plans, many=True)
        return Response(serializer.data)




# =========================================================
# GLOBAL MRP RUN (Multi-level + Basic Capacity Check)
# =========================================================
class RunMRPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org = request.user.organization
        today = timezone.now().date()

        plan = ProductionPlan.objects.create(
            organization=org,
            created_by=request.user,
            planned_date=today,
            status="mrp_done"
        )

        # Step 1: Collect top-level demand from open sales orders
        demand_qs = SalesOrderItem.objects.filter(
            sales_order__organization=org
        ).values("product_id").annotate(total_demand=Sum("quantity"))

        created_count = 0
        capacity_warnings = []
        dependent_demands = defaultdict(Decimal)  # product_id → required qty

        def explode_bom(product_id, required_qty, level=0):
            nonlocal created_count

            dependent_demands[product_id] += required_qty

            try:
                product = Item.objects.get(id=product_id, organization=org)
            except Item.DoesNotExist:
                return

            # Find active BOM
            bom = BillOfMaterial.objects.filter(
                product=product,
                organization=org,
                is_active=True
            ).order_by('-created_at').first()

            if not bom:
                return  # Purchased item or no BOM

            for line in bom.lines.all():
                comp_qty = line.quantity * required_qty
                explode_bom(line.component_id, comp_qty, level + 1)

        # Step 2: Explode from top-level demand
        for row in demand_qs:
            product_id = row["product_id"]
            gross_demand = row["total_demand"] or Decimal('0')
            try:
                product = Item.objects.get(id=product_id, organization=org)
                net_req = gross_demand - Decimal(str(product.current_stock or '0'))
                if net_req > 0:
                    explode_bom(product_id, net_req)
            except Item.DoesNotExist:
                continue

        # Step 3: Create Planned Orders + Capacity Check
        for prod_id, total_req in dependent_demands.items():
            if total_req <= 0:
                continue

            try:
                product = Item.objects.get(id=prod_id, organization=org)
            except Item.DoesNotExist:
                continue

            # Basic lead time (improve later with routing)
            lead_days = getattr(product, 'lead_time_days', 7) or 7
            planned_start = today
            planned_finish = today + timedelta(days=lead_days)

            PlannedOrder.objects.create(
                production_plan=plan,
                product=product,
                quantity=total_req,
                planned_start=planned_start,
                planned_finish=planned_finish,
                status="planned"
            )
            created_count += 1

            # Rough capacity warning
            routing = Routing.objects.filter(product=product, is_active=True).first()
            if routing:
                total_load_hours = Decimal('0')
                for op in routing.operations.all():
                    if op.work_center:
                        op_load = (
                            op.setup_time_hours +
                            (op.machine_time_per_unit + op.labor_time_per_unit) * total_req
                        )
                        total_load_hours += op_load

                days_span = max((planned_finish - planned_start).days + 1, 1)
                daily_load = total_load_hours / days_span

                wc = op.work_center  # last one for simplicity
                wc_capacity = wc.available_hours_per_day * wc.efficiency_percentage / Decimal('100')
                if daily_load > wc_capacity * wc.number_of_machines:
                    capacity_warnings.append(
                        f"Capacity warning: {product.name} overloads {wc.name} "
                        f"({daily_load:.1f}h/day > {wc_capacity:.1f}h/day)"
                    )

        response_data = {
            "detail": f"MRP completed – {created_count} planned orders created (multi-level)",
            "production_plan_id": plan.id,
            "capacity_warnings": capacity_warnings
        }

        if capacity_warnings:
            response_data["detail"] += " (with capacity warnings)"

        return Response(response_data, status=status.HTTP_201_CREATED)


# =========================================================
# PRODUCTION DASHBOARD COUNTERS
# =========================================================
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


# =========================================================
# PLANNED ORDERS - LIST & MANUAL CREATE
# =========================================================
class PlannedOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = PlannedOrder.objects.filter(
            production_plan__organization=request.user.organization
        ).select_related("product", "production_plan").order_by("-planned_start")

        serializer = PlannedOrderSerializer(orders, many=True)
        return Response(serializer.data)


class PlannedOrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product")
        quantity_str = request.data.get("quantity")

        if not product_id or not quantity_str:
            return Response({"error": "product and quantity are required"}, status=400)

        try:
            qty = Decimal(quantity_str)
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


# =========================================================
# CONVERT PLANNED ORDER → MANUFACTURING ORDER
# =========================================================
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

        # Optional: copy routing operations if you have MOOperation model
        # routing = Routing.objects.filter(product=planned.product, is_active=True).first()
        # if routing:
        #     for op in routing.operations.all():
        #         MOOperation.objects.create(...)

        planned.status = "converted"
        planned.save()

        return Response({
            "detail": "Converted to Manufacturing Order",
            "mo_id": mo.id
        }, status=201)


# =========================================================
# MANUFACTURING ORDERS - LIST, START, COMPLETE
# =========================================================
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

        # Update finished goods stock
        item = mo.product
        item.current_stock = (item.current_stock or Decimal('0')) + mo.quantity
        item.save()

        return Response({"detail": "Production completed — finished goods stock updated"})