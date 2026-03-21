from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F, Value ,Q, DecimalField
from django.db.models.functions import Coalesce
from decimal import Decimal
from rest_framework import status,viewsets
from django.db import transaction
from datetime import date
from django.utils import timezone
from rest_framework.views import APIView
from .models import (
    Item,
    PurchaseOrder, PurchaseOrderItem,
    GateEntry,
    GRN,
    QualityInspection,
    VendorInvoice,
    VendorPayment,Machine
)
from .serializers import (
    ItemSerializer,
    PurchaseOrderSerializer,
    GateEntrySerializer,
    GRNSerializer,
    QualityInspectionSerializer,
    VendorInvoiceSerializer,
    VendorPaymentSerializer,MachineSerializer
)

class ItemListForQuotation(APIView):
    def get(self, request):
        items = Item.objects.filter(organization=request.user.organization)
        serializer = ItemSerializer(items, many=True)
        return Response(serializer.data)
    
from apps.finance.services.voucher_service import create_voucher
from apps.inventory.models import StockLedger

# ========================= ITEM =========================
class ItemViewSet(ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer
    permission_classes = [IsAuthenticated]

# ========================= PURCHASE ORDER =========================
class PurchaseOrderViewSet(ModelViewSet):
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return PurchaseOrder.objects.filter(
            organization=self.request.user.organization
        )

    @action(detail=False, methods=["get"])
    def pending_for_gate(self, request):
        qs = self.get_queryset().filter(status="approved").annotate(
            total_ordered=Coalesce(Sum("items__ordered_qty"), 0),
            total_received=Coalesce(Sum("items__received_qty"), 0)
        ).filter(total_ordered__gt=F("total_received"))
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        po = self.get_object()
        if po.status != "draft":
            return Response({"error": "Only draft POs can be approved"}, status=400)
        po.status = "approved"
        po.save()
        return Response({"status": "approved"})

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        po = self.get_object()
        if po.status != "draft":
            return Response({"error": "Only draft POs can be rejected"}, status=400)
        po.status = "cancelled"  # or "rejected"
        po.save()
        # Optional: save rejection reason
        return Response({"status": "rejected"})

# ========================= GATE ENTRY =========================
class GateEntryViewSet(ModelViewSet):
    serializer_class = GateEntrySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GateEntry.objects.filter(
            organization=self.request.user.organization
        )

    @action(detail=False, methods=['get'], url_path='pending-for-qc')
    def pending_for_qc(self, request):
        qs = self.get_queryset().filter(status__in=['pending_qc', 'qc_in_progress'])
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='ready-for-grn')
    def ready_for_grn(self, request):
        from django.db.models import Exists, OuterRef
        from .models import QualityInspection

        qs = self.get_queryset().filter(
            Exists(
                QualityInspection.objects.filter(
                    gate_entry=OuterRef('pk'),
                    is_approved=True
                )
            )
        ).distinct()

        print(f"[GRN-READY] Found {qs.count()} gate entries with approved QC")

        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


# ========================= GRN =========================
class GRNViewSet(viewsets.ModelViewSet):
    serializer_class = GRNSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GRN.objects.filter(
            organization=self.request.user.organization
        )

    @action(detail=False, methods=["get"])
    def pending_for_approval(self, request):
        qs = self.get_queryset().filter(status="pending_approval")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def pending_for_invoice(self, request):
        qs = self.get_queryset().filter(status="approved").exclude(
            id__in=VendorInvoice.objects.filter(organization=request.user.organization).values_list("grn__id", flat=True)
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """
        Approve GRN:
        - Atomic transaction
        - Creates stock ledger entries (IN) → stock updated automatically
        - Updates PO received qty
        - Closes PO if fully received
        - NO accounting voucher created (as requested)
        """
        grn = self.get_object()

        if grn.status != 'pending_approval':
            return Response(
                {"error": f"GRN is already {grn.status}. Only 'pending_approval' GRNs can be approved."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent double-approval (race condition)
        if GRN.objects.filter(pk=grn.pk, status='approved').exists():
            return Response(
                {"error": "This GRN has already been approved by another process."},
                status=status.HTTP_409_CONFLICT
            )

        total_value = Decimal('0.00')  # still calculate for logging/response (optional)
        created_ledgers = []

        try:
            with transaction.atomic():
                # Ensure PO exists
                if not grn.po:
                    raise ValueError("GRN has no linked Purchase Order")

                for grn_item in grn.items.select_related('item').iterator():
                    # Lock the PO item to prevent concurrent updates
                    try:
                        po_item = PurchaseOrderItem.objects.select_for_update().get(
                            purchase_order=grn.po,
                            item=grn_item.item
                        )
                    except PurchaseOrderItem.DoesNotExist:
                        raise ValueError(f"No PO item found for {grn_item.item.code} in PO {grn.po.po_number}")

                    # Avoid duplicate ledger entry
                    ref = f"GRN-{grn.grn_number}-{grn_item.item.code}"
                    if StockLedger.objects.filter(reference=ref, transaction_type='IN').exists():
                        continue

                    # Update PO received qty (atomic)
                    po_item.received_qty = F('received_qty') + grn_item.received_qty
                    po_item.save(update_fields=['received_qty'])
                    po_item.refresh_from_db()

                    # Create stock IN entry → this automatically updates stock
                    ledger = StockLedger.objects.create(
                        item=grn_item.item,
                        quantity=grn_item.received_qty,
                        transaction_type='IN',
                        reference=ref,
                        created_by=request.user,
                    )
                    created_ledgers.append(ledger)

                    # Optional: still accumulate total_value for response/logging
                    unit_price = po_item.unit_price if po_item.unit_price is not None else Decimal('0.00')
                    total_value += grn_item.received_qty * unit_price

                if not created_ledgers and grn.items.exists():
                    raise ValueError("No new stock entries created – check data consistency")

                # Mark GRN approved
                grn.status = 'approved'
                grn.approved_by = request.user
                grn.approved_at = timezone.now()
                grn.save(update_fields=['status', 'approved_by', 'approved_at'])

                # Close PO if fully received
                grn.po.check_and_close()

            # Success response
            return Response({
                "message": "GRN approved successfully – stock updated automatically",
                "grn_number": grn.grn_number,
                "items_processed": len(created_ledgers),
                "total_value": float(total_value.quantize(Decimal('0.00'))),
            }, status=status.HTTP_200_OK)

        except ValueError as ve:
            return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)

        except PurchaseOrderItem.DoesNotExist:
            return Response(
                {"error": "One or more linked PO items not found."},
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            import traceback
            full_traceback = traceback.format_exc()
            print("GRN APPROVAL CRASHED:")
            print(full_traceback)
            return Response({
                "error": "Internal error during GRN approval",
                "detail": str(e),
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
# ========================= QUALITY INSPECTION =========================
class QualityInspectionViewSet(ModelViewSet):
    serializer_class = QualityInspectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = QualityInspection.objects.filter(
            gate_entry__organization=self.request.user.organization
        )

        gate_entry = self.request.query_params.get('gate_entry')
        is_approved = self.request.query_params.get('is_approved')

        if gate_entry:
            qs = qs.filter(gate_entry_id=gate_entry)

        if is_approved is not None:
            qs = qs.filter(is_approved=is_approved.lower() == 'true')

        return qs


# ========================= VENDOR INVOICE =========================
class VendorInvoiceViewSet(ModelViewSet):
    serializer_class = VendorInvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VendorInvoice.objects.filter(
            organization=self.request.user.organization
        )

    @action(detail=False, methods=["get"])
    def pending_for_payment(self, request):
        qs = self.get_queryset().annotate(
            paid=Coalesce(Sum("vendorpayment__amount"), Value(0))
        ).filter(paid__lt=F("total_amount"))
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

# ========================= VENDOR PAYMENT =========================
class VendorPaymentViewSet(ModelViewSet):
    serializer_class = VendorPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return VendorPayment.objects.filter(
            invoice__organization=self.request.user.organization
        )

from decimal import Decimal
from django.db.models import Sum, Q, F, DecimalField
from django.db.models.functions import Coalesce
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response


class InventoryDashboardStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get organization
        organization = getattr(request.user, 'organization', None)

        if not organization:
            return Response({"error": "Organization not found"}, status=400)

        # Annotate current stock
        items = Item.objects.filter(organization=organization).annotate(
            current_stock=Coalesce(
                Sum(
                    'grnitem__received_qty',
                    filter=Q(grnitem__grn__status='approved'),
                    output_field=DecimalField(max_digits=20, decimal_places=2)
                ),
                Decimal('0.00')
            )
        )

        # Total items
        total_items = items.count()

        # Out of stock
        out_of_stock = items.filter(current_stock=0).count()

        # Low stock
        LOW_STOCK_THRESHOLD = Decimal('5.00')

        low_stock = items.filter(
            current_stock__gt=0,
            current_stock__lte=LOW_STOCK_THRESHOLD
        ).count()

        # ✅ FIXED INVENTORY VALUE CALCULATION
        inventory_value = items.aggregate(
            total=Coalesce(
                Sum(
                    F('current_stock') * F('standard_price'),
                    output_field=DecimalField(max_digits=20, decimal_places=2)
                ),
                Decimal('0.00')
            )
        )['total']

        # Pending Purchase Orders
        pending_pos = PurchaseOrder.objects.filter(
            organization=organization,
            status__in=['draft', 'approved']
        ).count()

        # Pending GRNs
        pending_grns = GRN.objects.filter(
            organization=organization,
            status='pending_approval'
        ).count()

        data = {
            "totalItems": total_items,
            "lowStock": low_stock,
            "outOfStock": out_of_stock,
            "inventoryValue": float(inventory_value or 0),
            "pendingPOs": pending_pos,
            "pendingGRNs": pending_grns,
        }

        return Response(data)
class InventoryDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Example – adjust based on your real logic
        low_stock = Item.objects.filter(
            organization=request.user.organization,
            current_stock__lte=10  # or use min_stock_level field if you have it
        ).count()

        # MRP shortages – if you have MRPRequirement model
        shortages = 0  # replace with real count later
        # shortages = MRPRequirement.objects.filter(shortage__gt=0).count()

        data = {
            'low_stock_items': low_stock,
            'material_shortages': shortages,
            'pending_pos': 5,  # example – count open Purchase Orders
        }
        return Response(data)

from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import IntegrityError
from rest_framework import serializers
import logging

from .models import Machine
from .serializers import MachineSerializer
from apps.hr.models import Employee

# Set up logging
logger = logging.getLogger(__name__)


class MachineViewSet(viewsets.ModelViewSet):
    """
    API endpoint for machines/work centers:
    - List: GET    /inventory/machines/
    - Create: POST /inventory/machines/
    - Retrieve: GET    /inventory/machines/<id>/
    - Update: PUT/PATCH /inventory/machines/<id>/
    - Delete: DELETE   /inventory/machines/<id>/
    """
    serializer_class = MachineSerializer
    permission_classes = [IsAuthenticated]

    # Required for ModelViewSet
    queryset = Machine.objects.none()  # ← placeholder, overridden below

    def get_queryset(self):
        """
        Only return machines from the user's organization
        """
        user = self.request.user
        organization = self._get_user_organization(user)
        
        if organization:
            return Machine.objects.filter(organization=organization)
        
        return Machine.objects.none()

    def _get_user_organization(self, user):
        """Helper method to get user's organization"""
        if hasattr(user, 'organization') and user.organization:
            return user.organization
        
        try:
            employee = Employee.objects.get(user=user)
            return employee.organization
        except Employee.DoesNotExist:
            return None
        except Exception as e:
            logger.error(f"Error getting user organization: {str(e)}")
            return None

    def get_object(self):
        """
        Override to enforce organization check on retrieve/update/delete
        """
        queryset = self.filter_queryset(self.get_queryset())
        pk = self.kwargs.get('pk')
        obj = get_object_or_404(queryset, pk=pk)
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        user = self.request.user
        organization = self._get_user_organization(user)
        
        if not organization:
            logger.error(f"No organization found for user: {user.id if user else 'No user'}")
            raise PermissionDenied("No organization associated with this user")
        
        try:
            serializer.save(
                organization=organization,
                created_by=user
            )
        except IntegrityError as e:
            logger.error(f"IntegrityError in machine creation: {str(e)}")
            if 'unique constraint' in str(e).lower():
                raise serializers.ValidationError({
                    'code': 'A machine with this code already exists in your organization.'
                })
            raise
        except Exception as e:
            logger.error(f"Unexpected error in machine creation: {str(e)}")
            raise

    def perform_update(self, serializer):
        """
        Update machine with organization check
        """
        try:
            serializer.save(organization=self.get_object().organization)
        except Exception as e:
            logger.error(f"Error updating machine: {str(e)}")
            raise

    def perform_destroy(self, instance):
        """
        Check if machine can be deleted before removing
        """
        try:
            instance.delete()
        except Exception as e:
            logger.error(f"Error deleting machine: {str(e)}")
            raise
    
    def create(self, request, *args, **kwargs):
        """Override create to provide better error messages"""
        try:
            # Log the incoming data for debugging
            logger.info(f"Creating machine with data: {request.data}")
            
            return super().create(request, *args, **kwargs)
        except serializers.ValidationError as e:
            logger.error(f"Validation error: {str(e.detail) if hasattr(e, 'detail') else str(e)}")
            return Response(
                e.detail if hasattr(e, 'detail') else {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionDenied as e:
            logger.error(f"Permission denied: {str(e)}")
            return Response(
                {"detail": str(e)},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            logger.error(f"Unexpected error in machine creation: {str(e)}", exc_info=True)
            return Response(
                {"detail": f"An error occurred while creating the machine: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )