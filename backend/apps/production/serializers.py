# apps/production/serializers.py

from rest_framework import serializers
from .models import *
from apps.inventory.serializers import MachineSerializer  # Import Machine serializer


class MachineBasicSerializer(serializers.ModelSerializer):
    """Basic Machine serializer for nested relationships"""
    class Meta:
        model = Machine
        fields = ['id', 'name', 'code', 'work_center_type', 'maintenance_status']


class BOMLineSerializer(serializers.ModelSerializer):
    material_name = serializers.CharField(source='material.name', read_only=True)
    material_code = serializers.CharField(source='material.code', read_only=True)
    
    class Meta:
        model = BOMLine
        fields = ['id', 'material', 'material_name', 'material_code', 'quantity']


class BillOfMaterialSerializer(serializers.ModelSerializer):
    lines = BOMLineSerializer(many=True, read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = BillOfMaterial
        fields = ['id', 'organization', 'product', 'product_name', 'version', 
                  'is_active', 'created_at', 'lines']


class RoutingOperationSerializer(serializers.ModelSerializer):
    machine_details = MachineBasicSerializer(source='machine', read_only=True)
    
    class Meta:
        model = RoutingOperation
        fields = ['id', 'routing', 'machine', 'machine_details', 'operation_name',
                  'sequence', 'setup_time_hours', 'run_time_per_unit', 'expected_hours']


class RoutingSerializer(serializers.ModelSerializer):
    operations = RoutingOperationSerializer(many=True, read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Routing
        fields = ['id', 'organization', 'product', 'product_name', 'name', 'operations']


class ProductionPlanSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    sales_order_number = serializers.CharField(source='sales_order.order_number', read_only=True)
    
    class Meta:
        model = ProductionPlan
        fields = ['id', 'organization', 'sales_order', 'sales_order_number', 
                  'planned_date', 'status', 'created_by', 'created_by_name', 'created_at']


class PlannedOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    production_plan_status = serializers.CharField(source='production_plan.status', read_only=True)
    
    class Meta:
        model = PlannedOrder
        fields = ['id', 'production_plan', 'production_plan_status', 'product', 
                  'product_name', 'product_code', 'quantity', 'planned_start', 
                  'planned_finish', 'status','scheduling_type']


class MOOperationSerializer(serializers.ModelSerializer):
    machine_details = MachineBasicSerializer(source='machine', read_only=True)
    
    class Meta:
        model = MOOperation
        fields = ['id', 'manufacturing_order', 'machine', 'machine_details', 
                  'operation_name', 'sequence', 'expected_hours', 'actual_hours',
                  'status', 'started_at', 'completed_at']

class ManufacturingOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_code = serializers.CharField(source='product.code', read_only=True)
    planned_order_ref = serializers.CharField(source='planned_order.id', read_only=True)
    operations = MOOperationSerializer(many=True, read_only=True)
    
    class Meta:
        model = ManufacturingOrder
        fields = ['id', 'planned_order', 'planned_order_ref', 'product', 
                  'product_name', 'product_code', 'quantity', 'status',
                  'start_date', 'finish_date', 'operations']