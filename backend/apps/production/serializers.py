# apps/production/serializers.py
from rest_framework import serializers
from .models import (
    WorkCenter, BillOfMaterial, BOMLine, Routing, RoutingOperation,
    ProductionPlan, PlannedOrder, PurchaseRequisition,
    ManufacturingOrder, MOOperation
)
from apps.sales.models import SalesOrder

class WorkCenterSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkCenter
        fields = "__all__"


class BOMLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = BOMLine
        fields = "__all__"


class BillOfMaterialSerializer(serializers.ModelSerializer):
    lines = BOMLineSerializer(many=True, read_only=True)
    class Meta:
        model = BillOfMaterial
        fields = "__all__"


class RoutingOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutingOperation
        fields = "__all__"


class RoutingSerializer(serializers.ModelSerializer):
    operations = RoutingOperationSerializer(many=True, read_only=True)
    class Meta:
        model = Routing
        fields = "__all__"


class ProductionPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductionPlan
        fields = "__all__"

# serializers.py

class PlannedOrderSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    sales_orders = serializers.SerializerMethodField()

    class Meta:
        model = PlannedOrder
        fields = "__all__"

    def get_sales_orders(self, obj):
        return [
            {
                "id": so.id,
                "order_number": so.order_number
            }
            for so in obj.sales_orders.all()
        ]

    def create(self, validated_data):
        sales_orders = validated_data.pop("sales_orders", [])
        planned_order = PlannedOrder.objects.create(**validated_data)
        planned_order.sales_orders.set(sales_orders)
        return planned_order


class PurchaseRequisitionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseRequisition
        fields = "__all__"


class ManufacturingOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ManufacturingOrder
        fields = "__all__"


class MOOperationSerializer(serializers.ModelSerializer):
    class Meta:
        model = MOOperation
        fields = "__all__"
from rest_framework import serializers
from .models import ItemProcess, ItemProcessStep, DepartmentTransaction


class ItemProcessStepSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = ItemProcessStep
        fields = ["sequence", "department", "department_name"]


class ItemProcessSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    steps = ItemProcessStepSerializer(many=True, read_only=True)

    class Meta:
        model = ItemProcess
        fields = ["id", "item", "item_name", "name", "is_active", "steps"]


class ItemProcessCreateUpdateSerializer(serializers.ModelSerializer):
    steps = ItemProcessStepSerializer(many=True)

    class Meta:
        model = ItemProcess
        fields = ["item", "name", "steps"]

    def create(self, validated_data):
        steps_data = validated_data.pop("steps", [])

        process = ItemProcess.objects.create(
            organization=self.context["request"].user.organization,
            **validated_data
        )

        for idx, step_data in enumerate(steps_data, start=1):
            ItemProcessStep.objects.create(
                process=process,
                sequence=idx,
                department=step_data["department"]
            )

        return process


class DepartmentTransactionListSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source="item.name", read_only=True)
    current_department_name = serializers.CharField(source="current_department.name", read_only=True)
    next_department_name = serializers.CharField(source="next_department.name", read_only=True)
    display_name = serializers.SerializerMethodField()

    class Meta:
        model = DepartmentTransaction
        fields = [
            "id", "item", "item_name", "quantity", "status",
            "current_department", "current_department_name",
            "next_department", "next_department_name",
            "display_name", "started_at", "completed_at"
        ]

    def get_display_name(self, obj):
        return obj.get_display_name()


class DepartmentTransactionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DepartmentTransaction
        fields = [
            "manufacturing_order", "process_step", "current_department",
            "next_department", "item", "quantity"
        ]
        
