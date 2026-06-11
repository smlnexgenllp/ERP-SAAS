# apps/transport/views.py

from rest_framework import viewsets,permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Vehicle,
    Driver,
    TransportTrip,
    FuelEntry,
    VehicleMaintenance,
    TransportExpense,
    TransportInvoice,TransportRoute,DeliveryProof
)

from .serializers import (
    VehicleSerializer,
    DriverSerializer,
    TransportTripSerializer,
    FuelEntrySerializer,
    VehicleMaintenanceSerializer,VehicleMaintenanceListSerializer,VehicleDropdownSerializer,
    TransportExpenseSerializer,
    TransportInvoiceSerializer,TransportRouteSerializer,DeliveryProofSerializer
)
from rest_framework.decorators import action
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
# =========================================================
# VEHICLE
# =========================================================

class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all().order_by("-id")
    serializer_class = VehicleSerializer


# =========================================================
# DRIVER
# =========================================================

class DriverViewSet(viewsets.ModelViewSet):
    queryset = Driver.objects.all().order_by("-id")
    serializer_class = DriverSerializer


# =========================================================
# TRANSPORT TRIP
# =========================================================

class TransportTripViewSet(viewsets.ModelViewSet):
    queryset = TransportTrip.objects.all().select_related(
        'sales_order', 'customer', 'vehicle', 'driver', 'route'
    ).prefetch_related('items')
    
    serializer_class = TransportTripSerializer

    def get_queryset(self):
        return self.queryset.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        """
        Auto-fill missing important fields during trip creation
        """
        validated_data = serializer.validated_data
        sales_order = validated_data.get('sales_order')

        extra_data = {
            'organization': self.request.user.organization,
            'created_by': self.request.user,
            'trip_status': 'planned',
        }

        # Auto-fill Customer from Sales Order if not provided
        if sales_order and not validated_data.get('customer'):
            extra_data['customer'] = sales_order.customer

        # Auto-fill timing fields (you can adjust these defaults)
        now = timezone.now()
        
        extra_data.update({
            'loading_start_time': now,                                      # Current time
            'loading_end_time': now + timezone.timedelta(minutes=45),     # Example
            'departure_time': now + timezone.timedelta(hours=1),          # 1 hour later
            'expected_arrival': now + timezone.timedelta(hours=6),        # 6 hours later
            # actual_arrival, unloading_start_time, unloading_end_time remain NULL until trip progresses
        })

        serializer.save(**extra_data)

    @action(detail=False, methods=['get'])
    def from_sales_order(self, request):
        """Get Sales Order details to pre-fill trip"""
        sales_order_id = request.query_params.get('sales_order_id')
        if not sales_order_id:
            return Response({"error": "sales_order_id is required"}, status=400)
        
        try:
            sales_order = SalesOrder.objects.get(
                id=sales_order_id, 
                organization=request.user.organization
            )
            data = {
                'sales_order': sales_order.id,
                'customer': sales_order.customer.id,
                'expected_delivery_date': sales_order.expected_delivery_date,
                'shipping_address': sales_order.shipping_address,
                'items': [
                    {
                        'sales_order_item': item.id,
                        'item': item.product.id if item.product else None,
                        'description': item.description or str(item.product),
                        'ordered_qty': item.quantity,
                    }
                    for item in sales_order.items.all()
                ]
            }
            return Response(data)
        except SalesOrder.DoesNotExist:
            return Response({"error": "Sales Order not found"}, status=404)
    def perform_update(self, serializer):
        # Auto update total_distance when ending_km changes
        if 'ending_km' in serializer.validated_data:
            instance = serializer.instance
            ending = serializer.validated_data.get('ending_km')
            if ending and instance.starting_km:
                serializer.validated_data['total_distance'] = max(0, ending - instance.starting_km)

        # Auto set unloading times based on status
        new_status = serializer.validated_data.get('trip_status')
        if new_status == 'unloading' and not serializer.validated_data.get('unloading_start_time'):
            serializer.validated_data['unloading_start_time'] = timezone.now()
        elif new_status == 'completed' and not serializer.validated_data.get('unloading_end_time'):
            serializer.validated_data['unloading_end_time'] = timezone.now()

        serializer.save()
    
# =========================================================
# FUEL ENTRY
# =========================================================

class FuelEntryViewSet(viewsets.ModelViewSet):
    queryset = FuelEntry.objects.all().order_by("-id")
    serializer_class = FuelEntrySerializer

    def get_queryset(self):
        return self.queryset.filter(organization=self.request.user.organization)

# =========================================================
# VEHICLE MAINTENANCE
# =========================================================

class VehicleMaintenanceViewSet(viewsets.ModelViewSet):
    queryset = VehicleMaintenance.objects.select_related('vehicle', 'created_by')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['vehicle', 'status', 'maintenance_type', 'organization']

    def get_serializer_class(self):
        if self.action in ['list']:
            return VehicleMaintenanceListSerializer
        return VehicleMaintenanceSerializer

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            organization=self.request.user.organization   # ← Add this
        )

    # Optional: Get maintenance history for a specific vehicle
    @action(detail=False, methods=['get'])
    def vehicle_history(self, request):
        vehicle_id = request.query_params.get('vehicle_id')
        if not vehicle_id:
            return Response({"error": "vehicle_id is required"}, status=400)
        
        maintenances = VehicleMaintenance.objects.filter(vehicle_id=vehicle_id)
        serializer = VehicleMaintenanceListSerializer(maintenances, many=True)
        return Response(serializer.data)

    # Upcoming maintenance
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        maintenances = VehicleMaintenance.objects.filter(
            status__in=['scheduled', 'in_progress']
        ).order_by('next_service_date')[:10]   # Limit results

        serializer = VehicleMaintenanceListSerializer(maintenances, many=True)
        return Response(serializer.data)   # Should return array directly

    @action(detail=False, methods=['get'])
    def vehicles(self, request):
        vehicles = Vehicle.objects.filter(
            organization=request.user.organization,  # Filter by user's organization
            status__in=['available', 'maintenance']
        ).order_by('vehicle_number')
        
        serializer = VehicleDropdownSerializer(vehicles, many=True)
        return Response(serializer.data)
# =========================================================
# TRANSPORT EXPENSE
# =========================================================

class TransportExpenseViewSet(viewsets.ModelViewSet):
    queryset = TransportExpense.objects.select_related(
        'trip', 
        'trip__vehicle', 
        'trip__driver', 
        'created_by'
    ).order_by('-expense_date', '-created_at')
    
    serializer_class = TransportExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    
    filterset_fields = ['trip', 'expense_type', 'expense_date']
    search_fields = ['reference_number', 'notes', 'trip__trip_number']
    ordering_fields = ['expense_date', 'amount', 'created_at']

    def get_queryset(self):
        return self.queryset.filter(
            organization=self.request.user.organization
        )

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user
        )

    @action(detail=False, methods=['get'])
    def by_trip(self, request):
        trip_id = request.query_params.get('trip_id')
        if not trip_id:
            return Response({"error": "trip_id is required"}, status=400)
        
        expenses = self.get_queryset().filter(trip_id=trip_id)
        serializer = self.get_serializer(expenses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        summary = self.get_queryset().values('expense_type').annotate(
            total_amount=models.Sum('amount'),
            count=models.Count('id')
        ).order_by('-total_amount')
        return Response(summary)


# =========================================================
# TRANSPORT INVOICE
# =========================================================

class TransportInvoiceViewSet(viewsets.ModelViewSet):
    queryset = TransportInvoice.objects.select_related(
        'trip', 'trip__vehicle', 'customer', 'created_by'
    ).order_by('-invoice_date', '-created_at')
    
    serializer_class = TransportInvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    
    filterset_fields = ['trip', 'customer', 'payment_status', 'invoice_date']
    search_fields = ['invoice_number', 'trip__trip_number', 'customer__name']
    ordering_fields = ['invoice_date', 'grand_total', 'amount_paid']

    def get_queryset(self):
        return self.queryset.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user
        )

class TransportRouteViewSet(viewsets.ModelViewSet):
    serializer_class = TransportRouteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['route_code', 'source_location', 'destination_location']
    search_fields = ['route_code', 'source_location', 'destination_location']
    ordering_fields = ['route_code', 'distance_km', 'expected_hours']

    def get_queryset(self):
        """Important: Filter by organization (Multi-tenant safety)"""
        return TransportRoute.objects.filter(
            organization=self.request.user.organization
        )

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)

class DeliveryProofViewSet(viewsets.ModelViewSet):
    queryset = DeliveryProof.objects.select_related('trip', 'trip__driver').all()
    serializer_class = DeliveryProofSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Important for handling file uploads (signature & photo)
    parser_classes = (MultiPartParser, FormParser)
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['delivery_status', 'trip']

    def get_queryset(self):
        qs = super().get_queryset()
        # Filter by organization if your user has it
        user = self.request.user
        if hasattr(user, 'organization'):
            qs = qs.filter(trip__driver__organization=user.organization)
        return qs

    def perform_create(self, serializer):
        serializer.save()

    # Extra Action: Mark OTP as Verified
    @action(detail=True, methods=['post'])
    def verify_otp(self, request, pk=None):
        proof = self.get_object()
        proof.otp_verified = True
        proof.save()
        return Response({"message": "OTP verified successfully"}, status=status.HTTP_200_OK)

    # Extra Action: Update Status Only
    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        proof = self.get_object()
        status_value = request.data.get('delivery_status')
        if status_value:
            proof.delivery_status = status_value
            proof.save()
            return Response({"message": "Status updated"}, status=status.HTTP_200_OK)
        return Response({"error": "delivery_status required"}, status=status.HTTP_400_BAD_REQUEST)