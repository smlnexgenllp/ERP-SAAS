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

from .models import Machine
from .serializers import MachineSerializer


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

        if hasattr(user, 'organization') and user.organization:
            return Machine.objects.filter(organization=user.organization)

        # Fallback for employee-based users
        try:
            employee = Employee.objects.get(user=user)
            return Machine.objects.filter(organization=employee.organization)
        except Employee.DoesNotExist:
            return Machine.objects.none()

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
        org = None

        if hasattr(user, 'organization') and user.organization:
            org = user.organization
        else:
            try:
                employee = Employee.objects.get(user=user)
                org = employee.organization
            except Employee.DoesNotExist:
                raise PermissionDenied("No organization associated with this user")

        serializer.save(
            organization=org,
            created_by=user
        )

    def perform_update(self, serializer):
        """
        Optional: you can add extra checks here (e.g. only creator or admin can edit)
        """

        serializer.save()

    def perform_destroy(self, instance):
        """
        Optional: extra logic before delete (e.g. check if machine is in use)
        """

        instance.delete()
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Sum, Case, When, Value, DecimalField, F
from django.db.models.functions import Coalesce
from decimal import Decimal

from .models import StockLedger


# inventory/views.py

from django.db.models import Sum, Case, When, Value, DecimalField
from django.db.models.functions import Coalesce
from django.db.models import F
class DepartmentStockAPIView(APIView):
    def get(self, request):
        item_id = request.GET.get("item")
        department_id = request.GET.get("department")

        stock = StockLedger.objects.filter(
            item_id=item_id,
            department_id=department_id
        ).aggregate(
            stock=Coalesce(
                Sum(
                    Case(
                        When(transaction_type='IN', then='quantity'),
                        When(transaction_type='OUT', then=-1 * F('quantity')),
                        default=Value(0),
                        output_field=DecimalField()
                    )
                ),
                Value(0),
                output_field=DecimalField()
            )
        )

        return Response({"stock": stock["stock"]})
    
# inventory/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from django.shortcuts import get_object_or_404

from apps.inventory.models import (
    Item,
    StockLedger,
)
from apps.hr.models import Department
from apps.production.models import DepartmentTransaction
from django.contrib.auth import get_user_model

User = get_user_model()


class MaterialTransferAPIView(APIView):
    """
    Combined endpoint for Material Transfer:
    - GET  → List all transfers (history)
    - POST → Create new material transfer
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET /api/inventory/material-transfer/
        Returns list of department transfers for history
        """
        org = getattr(request.user, 'organization', None)
        if not org:
            return Response({"error": "Organization not found for user"}, status=400)

        transfers = DepartmentTransaction.objects.filter(
            organization=org
        ).select_related(
            'item', 'current_department', 'next_department', 'created_by'
        ).order_by('-created_at')

        data = []
        for t in transfers:
            sent_by_name = (
                f"{t.created_by.first_name} {t.created_by.last_name}".strip()
                if t.created_by else "—"
            )

            data.append({
                "id": t.id,
                "created_at": t.created_at.isoformat(),
                "from_department_name": t.current_department.name if t.current_department else "—",
                "to_department_name": t.next_department.name if t.next_department else "—",
                "item_name": t.item.name if t.item else "—",
                "quantity": str(t.quantity),
                "sent_by_name": sent_by_name,
                "status": t.status,
            })

        return Response(data)

    def post(self, request):
        """
        POST /api/inventory/material-transfer/
        Creates a new department transfer + stock ledger entries
        """
        data = request.data
        user = request.user
        org = getattr(user, 'organization', None)

        if not org:
            return Response({"error": "Organization not found for user"}, status=400)

        required_fields = ['from_department', 'to_department', 'item', 'quantity']
        for field in required_fields:
            if field not in data or not data[field]:
                return Response({"error": f"{field} is required"}, status=400)

        try:
            from_dept_id = int(data['from_department'])
            to_dept_id   = int(data['to_department'])
            item_id      = int(data['item'])
            qty          = Decimal(str(data['quantity']))

            if qty <= 0:
                return Response({"error": "Quantity must be positive"}, status=400)

            from_dept = get_object_or_404(Department, id=from_dept_id, organization=org)
            to_dept   = get_object_or_404(Department, id=to_dept_id, organization=org)
            item      = get_object_or_404(Item, id=item_id, organization=org)

            # Check available stock in source department
            current_stock = item.get_department_stock(department_id=from_dept.id)
            if qty > current_stock:
                return Response(
                    {"error": f"Insufficient stock in {from_dept.name}. Available: {current_stock}"},
                    status=400
                )

            with transaction.atomic():
                # Create the transfer record
                transfer = DepartmentTransaction.objects.create(
                    organization=org,
                    item=item,
                    current_department=from_dept,
                    next_department=to_dept,
                    quantity=qty,
                    created_by=user,
                    status="completed",  # change to "pending" if approval needed
                    completed_at=timezone.now(),
                )

                # Stock movement: OUT from source
                StockLedger.objects.create(
                    item=item,
                    quantity=qty,
                    transaction_type='OUT',
                    department=from_dept,
                    reference=f"Transfer #{transfer.id} to {to_dept.name}",
                    created_by=user,
                )

                # Stock movement: IN to destination
                StockLedger.objects.create(
                    item=item,
                    quantity=qty,
                    transaction_type='IN',
                    department=to_dept,
                    reference=f"Transfer #{transfer.id} from {from_dept.name}",
                    created_by=user,
                )

            # Prepare success response (for slip / modal)
            sent_by_name = (
                f"{user.first_name} {user.last_name}".strip()
                or user.username
                or "System User"
            )

            return Response({
                "id": transfer.id,
                "from_department_name": from_dept.name,
                "to_department_name": to_dept.name,
                "item_name": item.name,
                "quantity": str(qty),
                "sent_by_name": sent_by_name,
                "created_at": transfer.created_at.isoformat(),
                "message": "Material transfer completed successfully"
            }, status=status.HTTP_201_CREATED)

        except (ValueError, Department.DoesNotExist, Item.DoesNotExist) as e:
            return Response({"error": str(e)}, status=400)
        except Exception as e:
            return Response({"error": "Server error during transfer"}, status=500)
class ItemDepartmentStockView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, item_id, dept_id):
        try:
            item = Item.objects.get(id=item_id, organization=request.user.organization)
        except Item.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)

        stock = item.get_department_stock(dept_id)

        return Response({
            "item_id": item.id,
            "item_name": item.name,
            "department_id": dept_id,
            "available_stock": float(stock)
        })
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response


class AllDepartmentStockView(APIView):
    def get(self, request):
        data = (
            StockLedger.objects
            .values("item", "department")
            .annotate(stock=Sum("quantity"))
        )

        return Response(data)
