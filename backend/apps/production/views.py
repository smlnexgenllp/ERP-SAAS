# apps/production/views.py

from django.db.models import Sum, Count, Q, Value, DecimalField
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta

from .models import ProductionPlan, PlannedOrder, ManufacturingOrder
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
                        output_field=DecimalField()   # ← FIX: force Decimal output
                    ),
                    Value(0, output_field=DecimalField())  # ← consistent default
                )
            )
            .order_by("-total_sales_qty")
        )

        # Enrich with required_production (safe float conversion)
        result = []
        for row in data:
            total_demand = float(row["total_sales_qty"] or 0)
            stock = float(row["current_stock"] or 0)
            row["required_production"] = max(0, total_demand - stock)
            result.append(row)

        return Response(result)


# =========================================================
# PRODUCTION PLAN - CREATE
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


# =========================================================
# PRODUCTION PLAN - LIST
# =========================================================
class ProductionPlanListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plans = ProductionPlan.objects.filter(
            organization=request.user.organization
        ).select_related("sales_order", "created_by").order_by("-created_at")

        serializer = ProductionPlanSerializer(plans, many=True)
        return Response(serializer.data)


# =========================================================
# GLOBAL MRP RUN
# =========================================================
class RunMRPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan = ProductionPlan.objects.create(
            organization=request.user.organization,
            created_by=request.user,
            planned_date=timezone.now().date(),
            status="mrp_done"
        )

        demand = SalesOrderItem.objects.filter(
            sales_order__organization=request.user.organization
        ).values("product_id").annotate(
            total_demand=Sum("quantity")
        )

        created_count = 0
        for row in demand:
            try:
                product = Item.objects.get(
                    id=row["product_id"],
                    organization=request.user.organization
                )
            except Item.DoesNotExist:
                continue

            net_required = row["total_demand"] - product.current_stock
            if net_required > 0:
                PlannedOrder.objects.create(
                    production_plan=plan,
                    product=product,
                    quantity=int(net_required),
                    planned_start=plan.planned_date,
                    planned_finish=plan.planned_date + timedelta(days=7),
                    status="planned"
                )
                created_count += 1

        return Response({
            "detail": f"MRP completed – {created_count} planned orders created",
            "production_plan_id": plan.id
        }, status=status.HTTP_200_OK)


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
# PLANNED ORDERS LIST
# =========================================================
class PlannedOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = PlannedOrder.objects.filter(
            production_plan__organization=request.user.organization
        ).select_related("product", "production_plan").order_by("-planned_start")

        serializer = PlannedOrderSerializer(orders, many=True)
        return Response(serializer.data)


# =========================================================
# MANUAL PLANNED ORDER CREATE
# =========================================================
class PlannedOrderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        product_id = request.data.get("product")
        quantity = request.data.get("quantity")

        if not product_id or not quantity:
            return Response(
                {"error": "product and quantity are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Item.objects.get(
                id=product_id,
                organization=request.user.organization
            )
        except Item.DoesNotExist:
            return Response(
                {"error": "Product not found or access denied"},
                status=status.HTTP_404_NOT_FOUND
            )

        plan = ProductionPlan.objects.create(
            organization=request.user.organization,
            created_by=request.user,
            planned_date=timezone.now().date(),
            status="planned"
        )

        planned_order = PlannedOrder.objects.create(
            production_plan=plan,
            product=product,
            quantity=int(quantity),
            planned_start=timezone.now().date(),
            planned_finish=(timezone.now() + timedelta(days=7)).date(),
            status="planned"
        )

        serializer = PlannedOrderSerializer(planned_order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# =========================================================
# CONVERT PLANNED → MANUFACTURING ORDER
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

        mo = ManufacturingOrder.objects.create(
            planned_order=planned,
            product=planned.product,
            quantity=planned.quantity,
            status="draft"
        )

        planned.status = "converted"
        planned.save()

        return Response({
            "detail": "Converted to Manufacturing Order",
            "mo_id": mo.id
        }, status=201)


# =========================================================
# MANUFACTURING ORDERS LIST
# =========================================================
class ManufacturingOrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        orders = ManufacturingOrder.objects.filter(
            planned_order__production_plan__organization=request.user.organization
        ).select_related("product", "planned_order").order_by("-id")

        serializer = ManufacturingOrderSerializer(orders, many=True)
        return Response(serializer.data)


# =========================================================
# START MANUFACTURING ORDER
# =========================================================
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


# =========================================================
# COMPLETE MANUFACTURING ORDER
# =========================================================
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
        fg_item = mo.product
        fg_item.current_stock = (fg_item.current_stock or 0) + mo.quantity
        fg_item.save()

        return Response({"detail": "Production completed — finished goods stock updated"})