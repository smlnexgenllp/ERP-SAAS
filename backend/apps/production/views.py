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
    BillOfMaterial, Routing, RoutingOperation,MOOperation
)
from .serializers import (
    ProductionPlanSerializer, PlannedOrderSerializer,
    ManufacturingOrderSerializer
)
from apps.inventory.models import Item
# Add this import at the top of your views.py with your other imports
from apps.sales.models import SalesOrder, SalesOrderItem



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
# apps/production/views.py - Updated RunMRPView

# apps/production/views.py - Complete Updated RunMRPView

# apps/production/views.py - Updated RunMRPView with better BOM explosion

class RunMRPView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        org = request.user.organization
        today = timezone.now().date()

        # Get all confirmed sales orders
        sales_orders = SalesOrder.objects.filter(
            organization=org,
            status='approved'
        )
        
        if not sales_orders.exists():
            return Response({
                "detail": "No confirmed sales orders found"
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create production plan
        plan = ProductionPlan.objects.create(
            organization=org,
            created_by=request.user,
            planned_date=today,
            status="mrp_done"
        )
        
        # Link sales orders to the plan
        plan.sales_orders.set(sales_orders)

        # Step 1: Collect top-level demand
        demand_qs = SalesOrderItem.objects.filter(
            sales_order__organization=org,
            sales_order__status='approved'
        ).values("product_id").annotate(
            total_demand=Sum("quantity"),
            sales_order_list=ArrayAgg(
                "sales_order__order_number",
                distinct=True
            )
        )

        # Track requirements
        dependent_demands = defaultdict(Decimal)
        product_sales_orders = {}
        current_stock_cache = {}

        def get_stock(product_id):
            """Get current stock with caching"""
            if product_id not in current_stock_cache:
                try:
                    product = Item.objects.get(id=product_id, organization=org)
                    current_stock_cache[product_id] = Decimal(str(product.current_stock or '0'))
                except Item.DoesNotExist:
                    current_stock_cache[product_id] = Decimal('0')
            return current_stock_cache[product_id]

        def explode_bom(product_id, gross_demand, level=0, so_list=None):
            """
            Recursive BOM explosion with stock consideration
            Returns net requirement after stock deduction
            """
            # Get current stock
            current_stock = get_stock(product_id)
            
            # Calculate net requirement
            net_requirement = gross_demand - current_stock
            net_requirement = max(Decimal('0'), net_requirement)
            
            if net_requirement <= 0:
                return Decimal('0')
            
            # Add to dependent demands
            dependent_demands[product_id] += net_requirement
            
            if so_list:
                if product_id not in product_sales_orders:
                    product_sales_orders[product_id] = set()
                product_sales_orders[product_id].update(so_list)
            
            # Check if this product has BOM (is a finished good)
            try:
                product = Item.objects.get(id=product_id, organization=org)
                bom = BillOfMaterial.objects.filter(
                    product=product,
                    organization=org,
                    is_active=True
                ).order_by('-created_at').first()
                
                if bom:
                    # This is a finished good - explode its BOM
                    print(f"Level {level}: {product.name} - Net: {net_requirement}")
                    for line in bom.lines.all():
                        comp_qty = line.quantity * net_requirement
                        print(f"  -> Needs {comp_qty} of {line.material.name}")
                        explode_bom(line.material_id, comp_qty, level + 1, so_list)
                    return net_requirement
                else:
                    # This is a raw material - don't explode further
                    print(f"Level {level}: {product.name} (Raw Material) - Net: {net_requirement}")
                    return net_requirement
                    
            except Item.DoesNotExist:
                print(f"Product {product_id} not found")
                return Decimal('0')

        # Step 2: Explode BOM for all demands
        print("\n" + "="*60)
        print("MRP BOM EXPLOSION")
        print("="*60)
        
        for row in demand_qs:
            product_id = row["product_id"]
            gross_demand = row["total_demand"] or Decimal('0')
            sales_order_list = row.get("sales_order_list", [])
            
            try:
                product = Item.objects.get(id=product_id, organization=org)
                print(f"\nTop Level: {product.name}")
                print(f"  Gross Demand: {gross_demand}")
                print(f"  Current Stock: {get_stock(product_id)}")
                
                explode_bom(product_id, gross_demand, 0, sales_order_list)
                
            except Item.DoesNotExist:
                print(f"Product {product_id} not found")
                continue

        print("\n" + "="*60)
        print(f"Total products with requirements: {len(dependent_demands)}")
        print("="*60)

        # Step 3: Create Planned Orders
        created_count = 0
        capacity_warnings = []
        capacity_details = []
        
        for prod_id, total_req in dependent_demands.items():
            if total_req <= 0:
                continue

            try:
                product = Item.objects.get(id=prod_id, organization=org)
            except Item.DoesNotExist:
                continue

            # Check if this is a finished good (has BOM) or raw material
            has_bom = BillOfMaterial.objects.filter(
                product=product,
                organization=org,
                is_active=True
            ).exists()

            # Determine scheduling type
            if has_bom:
                scheduling_type = 'production'
                # Get routing for lead time calculation
                routing = Routing.objects.filter(
                    product=product,
                    organization=org
                ).first()
                
                # Calculate lead time based on routing
                if routing:
                    total_hours = routing.operations.aggregate(
                        total=Sum('expected_hours')
                    )['total'] or 0
                    lead_days = max(1, int((total_hours * float(total_req)) / 8))
                else:
                    lead_days = 7
            else:
                scheduling_type = 'purchase'
                lead_days = 3  # Standard lead time for purchased items

            planned_start = today
            planned_finish = today + timedelta(days=lead_days)

            planned_order = PlannedOrder.objects.create(
                production_plan=plan,
                product=product,
                quantity=int(total_req),
                planned_start=planned_start,
                planned_finish=planned_finish,
                status="planned",
                scheduling_type=scheduling_type
            )
            created_count += 1
            
            print(f"✅ Created {scheduling_type.upper()} Order: {product.name} - {total_req} units")

            # Check capacity only for production orders with routing
            if has_bom:
                routing = Routing.objects.filter(product=product, organization=org).first()
                if routing:
                    capacity_result = self.check_routing_capacity(
                        routing, total_req, planned_start, planned_finish, product
                    )
                    if capacity_result['warnings']:
                        capacity_warnings.extend(capacity_result['warnings'])
                    capacity_details.append(capacity_result['details'])

        response_data = {
            "detail": f"MRP completed – {created_count} planned orders created",
            "production_plan_id": plan.id,
            "sales_orders_processed": sales_orders.count(),
            "sales_orders_linked": plan.sales_orders.count(),
            "products_with_demand": len(demand_qs),
            "total_requirements": len(dependent_demands),
            "capacity_warnings": capacity_warnings,
            "capacity_details": capacity_details,
            "orders_summary": {
                "total": created_count,
                "production": len([p for p_id, p in dependent_demands.items() 
                                  if p > 0 and BillOfMaterial.objects.filter(
                                      product_id=p_id, is_active=True).exists()]),
                "purchase": len([p for p_id, p in dependent_demands.items() 
                                if p > 0 and not BillOfMaterial.objects.filter(
                                    product_id=p_id, is_active=True).exists()])
            }
        }

        if capacity_warnings:
            response_data["detail"] += " (with capacity warnings)"

        return Response(response_data, status=status.HTTP_201_CREATED)

    def check_routing_capacity(self, routing, quantity, start_date, end_date, product):
        """Check if machines have enough capacity"""
        warnings = []
        details = {
            'product': product.name,
            'operations': []
        }
        
        days_span = max((end_date - start_date).days + 1, 1)
        
        for operation in routing.operations.all().order_by('sequence'):
            machine = operation.machine
            
            if not machine:
                continue
                
            # Calculate required hours
            required_hours = float(operation.expected_hours) * float(quantity)
            daily_required = required_hours / days_span
            
            # Get machine's effective capacity
            effective_capacity = machine.get_effective_capacity(days=days_span)
            daily_capacity = effective_capacity / days_span
            
            # Check machine availability
            is_available = machine.is_available_for_scheduling(start_date, end_date)
            
            operation_check = {
                'name': operation.operation_name,
                'machine': machine.name,
                'required_hours': round(required_hours, 2),
                'daily_required': round(daily_required, 2),
                'available_hours': round(effective_capacity, 2),
                'daily_capacity': round(daily_capacity, 2),
                'is_available': is_available,
                'maintenance_status': machine.maintenance_status
            }
            
            if not is_available:
                warning = f"⚠️ {machine.name} not available ({machine.maintenance_status}) for {product.name}"
                warnings.append(warning)
                operation_check['warning'] = warning
                
            elif daily_required > daily_capacity:
                warning = (f"⚠️ {machine.name} capacity exceeded for {product.name}: "
                          f"need {round(daily_required,1)}h/day, have {round(daily_capacity,1)}h/day")
                warnings.append(warning)
                operation_check['warning'] = warning
                
            details['operations'].append(operation_check)
            
        return {
            'warnings': warnings,
            'details': details
        }


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
            status="planned",
            scheduling_type="basic" 
        )

        return Response(PlannedOrderSerializer(po).data, status=201)


# =========================================================
# CONVERT PLANNED ORDER → MANUFACTURING ORDER
# =========================================================
# Update ConvertToMOView in apps/production/views.py

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

        # Create Manufacturing Order
        mo = ManufacturingOrder.objects.create(
            planned_order=planned,
            product=planned.product,
            quantity=planned.quantity,
            status="draft"
        )

        # Get routing and create operations
        routing = Routing.objects.filter(
            product=planned.product,
            organization=request.user.organization
        ).first()

        operations_created = 0
        if routing:
            for op in routing.operations.all().order_by('sequence'):
                # FIX: Use 'machine' field, not 'work_center'
                MOOperation.objects.create(
                    manufacturing_order=mo,
                    machine=op.machine,  # Changed from work_center to machine
                    operation_name=op.operation_name,
                    sequence=op.sequence,
                    expected_hours=op.expected_hours,
                    status="pending"
                )
                operations_created += 1

        planned.status = "converted"
        planned.save()

        return Response({
            "detail": "Converted to Manufacturing Order",
            "mo_id": mo.id,
            "operations_count": operations_created,
            "product": planned.product.name,
            "quantity": planned.quantity
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

# Add to apps/production/views.py

# apps/production/views.py - Fix MachineLoadView

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