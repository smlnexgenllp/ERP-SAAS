from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F, Value
from django.db.models.functions import Coalesce
from decimal import Decimal
from rest_framework import status,viewsets
from django.db import transaction
from datetime import date
from django.utils import timezone
from .models import (
    Item,
    PurchaseOrder, PurchaseOrderItem,
    GateEntry,
    GRN,
    QualityInspection,
    VendorInvoice,
    VendorPayment
)
from .serializers import (
    ItemSerializer,
    PurchaseOrderSerializer,
    GateEntrySerializer,
    GRNSerializer,
    QualityInspectionSerializer,
    VendorInvoiceSerializer,
    VendorPaymentSerializer
)
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