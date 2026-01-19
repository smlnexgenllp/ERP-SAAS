from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, F, Value
from django.db.models.functions import Coalesce

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

    @action(detail=False, methods=["get"])
    def pending_for_qc(self, request):
        qs = self.get_queryset().filter(status="pending")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

# ========================= GRN =========================
class GRNViewSet(ModelViewSet):
    serializer_class = GRNSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return GRN.objects.filter(
            organization=self.request.user.organization
        )
    def perform_create(self, serializer):
        # Extra safety: force organization from user
        serializer.save(organization=self.request.user.organization)
        
    @action(detail=False, methods=["get"])
    def pending_for_approval(self, request):
        qs = self.get_queryset().filter(status="pending")
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def pending_for_invoice(self, request):
        qs = self.get_queryset().filter(status="approved").exclude(
            id__in=VendorInvoice.objects.filter(organization=request.user.organization).values_list("grn__id", flat=True)
        )
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        grn = self.get_object()
        if grn.status != "pending":
            return Response({"error": "GRN not pending"}, status=400)
        
        # Calculate total for voucher
        total = 0
        for grn_item in grn.items.all():
            po_item = PurchaseOrderItem.objects.filter(
                purchase_order=grn.po, item=grn_item.item
            ).first()
            total += grn_item.received_qty * po_item.unit_price
        
        # Update PO received_qty
        for grn_item in grn.items.all():
            po_item = PurchaseOrderItem.objects.get(
                purchase_order=grn.po, item=grn_item.item
            )
            po_item.received_qty += grn_item.received_qty
            po_item.save()
        
        # Add to stock ledger
        for grn_item in grn.items.all():
            StockLedger.objects.create(
                item=grn_item.item,
                quantity=grn_item.received_qty,
                transaction_type="IN",
                reference=grn.grn_number
            )
        
        # Create voucher
        create_voucher(
            voucher_type="GRN",
            narration=f"GRN {grn.grn_number} for PO {grn.po.po_number}",
            entries=[
                ("Inventory", "Dr", total),
                ("GRN Clearing", "Cr", total),
            ]
        )
        
        grn.status = "approved"
        grn.save(update_fields=["status"])
        
        # Check if PO can be closed
        grn.po.check_and_close()
        
        return Response({"status": "GRN approved"})

# ========================= QUALITY INSPECTION =========================
class QualityInspectionViewSet(ModelViewSet):
    serializer_class = QualityInspectionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QualityInspection.objects.filter(
            gate_entry__organization=self.request.user.organization
        )

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