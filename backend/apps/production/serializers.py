from rest_framework import serializers
from .models import *


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


class PlannedOrderSerializer(serializers.ModelSerializer):

    class Meta:
        model = PlannedOrder
        fields = "__all__"


class ManufacturingOrderSerializer(serializers.ModelSerializer):

    class Meta:
        model = ManufacturingOrder
        fields = "__all__"


class MOOperationSerializer(serializers.ModelSerializer):

    class Meta:
        model = MOOperation
        fields = "__all__"