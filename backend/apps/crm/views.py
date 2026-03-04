# apps/crm/views.py

from django.utils import timezone
from django.db.models import Count, Sum
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import (
    Contact, Opportunity, CallLog, Product, Activity, Customer,
    Quotation,
)
from .serializers import (
    ContactSerializer, OpportunitySerializer, CallLogSerializer,
    ProductSerializer, ActivitySerializer, CustomerSerializer,
    QuotationSerializer
)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Contact.objects.filter(organization=self.request.user.organization).select_related("created_by")

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user,
            status="new"
        )

    @action(detail=False, methods=["get"])
    def leads(self, request):
        qs = self.get_queryset().exclude(status="customer")
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def customers(self, request):
        qs = self.get_queryset().filter(status="customer")
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def due_followups(self, request):
        now = timezone.now()
        qs = self.get_queryset().filter(next_follow_up__lte=now)
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=["post"])
    def convert_to_customer(self, request, pk=None):
        contact = self.get_object()
        if contact.status == "customer":
            return Response({"error": "Already a customer"}, status=status.HTTP_400_BAD_REQUEST)
        contact.status = "customer"
        contact.save(update_fields=["status"])
        return Response({"message": "Converted to customer"})


class OpportunityViewSet(viewsets.ModelViewSet):
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Opportunity.objects.filter(contact__organization=self.request.user.organization).select_related(
            "contact", "created_by"
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def open(self, request):
        qs = self.get_queryset().exclude(stage__in=[Opportunity.Stage.WON, Opportunity.Stage.LOST])
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def won(self, request):
        qs = self.get_queryset().filter(stage=Opportunity.Stage.WON)
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def lost(self, request):
        qs = self.get_queryset().filter(stage=Opportunity.Stage.LOST)
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def high_value(self, request):
        threshold = float(request.query_params.get("threshold", 100000))
        qs = self.get_queryset().filter(value__gt=threshold)
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=False, methods=["get"])
    def by_stage(self, request):
        stats = self.get_queryset().values("stage").annotate(count=Count("id"))
        return Response(stats)

    @action(detail=True, methods=["post"])
    def mark_won(self, request, pk=None):
        opportunity = self.get_object()
        if opportunity.stage in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            return Response({"error": f"Already {opportunity.stage}"}, status=status.HTTP_400_BAD_REQUEST)
        opportunity.stage = Opportunity.Stage.WON
        opportunity.actual_close_date = timezone.now().date()
        opportunity.save(update_fields=["stage", "actual_close_date"])
        opportunity.contact.status = "customer"
        opportunity.contact.save(update_fields=["status"])
        return Response({"message": "Marked as WON"})

    @action(detail=True, methods=["post"])
    def mark_lost(self, request, pk=None):
        opportunity = self.get_object()
        if opportunity.stage in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            return Response({"error": f"Already {opportunity.stage}"}, status=status.HTTP_400_BAD_REQUEST)
        opportunity.stage = Opportunity.Stage.LOST
        opportunity.actual_close_date = timezone.now().date()
        opportunity.save(update_fields=["stage", "actual_close_date"])
        opportunity.contact.status = "lost"
        opportunity.contact.save(update_fields=["status"])
        return Response({"message": "Marked as LOST"})

    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        opportunity = self.get_object()
        if opportunity.stage not in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            return Response({"error": "Only won/lost opportunities can be reopened"}, status=status.HTTP_400_BAD_REQUEST)
        opportunity.stage = Opportunity.Stage.NEW
        opportunity.actual_close_date = None
        opportunity.save(update_fields=["stage", "actual_close_date"])
        return Response({"message": "Opportunity reopened"})

    @action(detail=True, methods=["post"])
    def create_quotation(self, request, pk=None):
        opportunity = self.get_object()
        if opportunity.stage != Opportunity.Stage.QUALIFIED:
            return Response({"error": "Opportunity must be qualified to create quotation"}, status=status.HTTP_400_BAD_REQUEST)
        quotation = Quotation.objects.create(
            opportunity=opportunity,
            created_by=request.user
        )
        return Response(QuotationSerializer(quotation).data)

    @action(detail=True, methods=["post"])
    def create_sales_order(self, request, pk=None):
        opportunity = self.get_object()
        if opportunity.stage != Opportunity.Stage.NEGOTIATION:
            return Response({"error": "Opportunity must be in negotiation to create sales order"}, status=status.HTTP_400_BAD_REQUEST)
        # Assume copying from latest quotation
        latest_quotation = opportunity.quotations.last()
        if not latest_quotation:
            return Response({"error": "No quotation found"}, status=status.HTTP_400_BAD_REQUEST)
        sales_order = SalesOrder.objects.create(
            quotation=latest_quotation,
            opportunity=opportunity,
            created_by=request.user,
            total=latest_quotation.total,
            discount=latest_quotation.discount,
            tax=latest_quotation.tax,
            grand_total=latest_quotation.grand_total,
            terms=latest_quotation.terms
        )
        for item in latest_quotation.items.all():
            SalesOrderItem.objects.create(
                sales_order=sales_order,
                product=item.product,
                description=item.description,
                quantity=item.quantity,
                price=item.price,
                subtotal=item.subtotal
            )
        return Response(SalesOrderSerializer(sales_order).data)

    @action(detail=True, methods=["post"])
    def create_invoice(self, request, pk=None):
        opportunity = self.get_object()
        if opportunity.stage != Opportunity.Stage.SALES_ORDER:
            return Response({"error": "Opportunity must have sales order to create invoice"}, status=status.HTTP_400_BAD_REQUEST)
        latest_sales_order = opportunity.sales_orders.last()
        if not latest_sales_order:
            return Response({"error": "No sales order found"}, status=status.HTTP_400_BAD_REQUEST)
        invoice = Invoice.objects.create(
            sales_order=latest_sales_order,
            created_by=request.user,
            total=latest_sales_order.total,
            discount=latest_sales_order.discount,
            tax=latest_sales_order.tax,
            grand_total=latest_sales_order.grand_total,
            terms=latest_sales_order.terms
        )
        for item in latest_sales_order.items.all():
            InvoiceItem.objects.create(
                invoice=invoice,
                product=item.product,
                description=item.description,
                quantity=item.quantity,
                price=item.price,
                subtotal=item.subtotal
            )
        return Response(InvoiceSerializer(invoice).data)


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Activity.objects.filter(opportunity__contact__organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CallLogViewSet(viewsets.ModelViewSet):
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CallLog.objects.filter(contact__organization=self.request.user.organization).select_related("contact", "called_by")

    def perform_create(self, serializer):
        call = serializer.save(called_by=self.request.user)
        contact = call.contact
        if call.result == "connected":
            contact.status = "contacted"
        elif call.result == "interested":
            contact.status = "interested"
            if not contact.opportunities.filter(
                stage__in=[
                    Opportunity.Stage.NEW,
                    Opportunity.Stage.CONTACTED,
                    Opportunity.Stage.QUALIFIED
                ]
            ).exists():
                Opportunity.objects.create(
                    contact=contact,
                    title=f"Opportunity - {contact.full_name}",
                    value=0,
                    stage=Opportunity.Stage.NEW,
                    created_by=self.request.user
                )
        elif call.result == "not_interested":
            contact.status = "lost"
        elif call.result == "callback":
            contact.status = "follow_up"
            contact.next_follow_up = timezone.now() + timezone.timedelta(days=2)
        contact.save()


class CustomerViewSet(viewsets.ModelViewSet):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Customer.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user
        )


class QuotationViewSet(viewsets.ModelViewSet):
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Quotation.objects.filter(opportunity__contact__organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

