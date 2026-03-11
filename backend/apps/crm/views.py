# apps/crm/views.py
from django.utils import timezone
from django.db.models import Count
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import (
    Contact, Opportunity, CallLog, Product, Activity, Customer,
    Quotation, QuotationItem
)
from .serializers import (
    ContactSerializer, OpportunitySerializer, CallLogSerializer,
    ProductSerializer, ActivitySerializer, CustomerSerializer,
    QuotationSerializer, QuotationItemSerializer
)


class ProductViewSet(viewsets.ModelViewSet):
    """
    CRUD for Products (organization-scoped)
    """
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Product.objects.filter(organization=self.request.user.organization)

    def perform_create(self, serializer):
        serializer.save(organization=self.request.user.organization)


class ContactViewSet(viewsets.ModelViewSet):
    """
    Contacts / Leads / Customers
    """
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Contact.objects.filter(
            organization=self.request.user.organization
        ).select_related("created_by")

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user,
            status="new"
        )

    @action(detail=False, methods=["get"])
    def leads(self, request):
        """All non-customer contacts"""
        qs = self.get_queryset().exclude(status="customer")
        serializer = self.get_serializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def customers(self, request):
        """Only converted customers"""
        qs = self.get_queryset().filter(status="customer")
        serializer = self.get_serializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def due_followups(self, request):
        """Contacts with overdue or due-today follow-ups"""
        today = timezone.now().date()
        qs = self.get_queryset().filter(
            next_follow_up__lte=today,
            next_follow_up__isnull=False
        ).order_by('next_follow_up')

        count = qs.count()
        serializer = self.get_serializer(qs, many=True, context={'request': request})

        return Response({
            "count": count,
            "due_or_overdue_date": today.isoformat(),
            "items": serializer.data
        })

    @action(detail=True, methods=["post"])
    def convert_to_customer(self, request, pk=None):
        """Convert a contact to full customer profile"""
        contact = self.get_object()

        if contact.status == "customer":
            return Response(
                {"detail": "Contact is already a customer"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            contact.status = "customer"
            contact.save(update_fields=["status"])

            customer, created = Customer.objects.get_or_create(
                contact=contact,
                defaults={
                    "organization": contact.organization,
                    "full_name": contact.full_name,
                    "email": contact.email,
                    "phone": contact.phone,
                    "company": contact.company,
                    "created_by": request.user,
                    "customer_since": timezone.now().date(),
                }
            )

        return Response({
            "detail": "Contact successfully converted to customer",
            "customer_id": customer.id,
            "was_created": created
        })

    @action(detail=True, methods=["post"])
    def complete_followup(self, request, pk=None):
        """Mark next follow-up as completed"""
        contact = self.get_object()

        if not contact.next_follow_up:
            return Response({"detail": "No follow-up scheduled"}, status=400)

        with transaction.atomic():
            contact.next_follow_up = None
            contact.save(update_fields=['next_follow_up'])

        return Response({"detail": "Follow-up marked as completed"})

    @action(detail=True, methods=["post"], url_path="move-to-sales")
    def move_to_sales(self, request, pk=None):
        """Move qualified/interested lead to sales pipeline"""
        contact = self.get_object()

        allowed = ["interested", "qualified"]
        if contact.status not in allowed:
            return Response(
                {"detail": f"Only {', '.join(allowed)} contacts can be moved to sales"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Optional: keep or update status
            contact.status = "qualified"
            contact.save(update_fields=["status"])

            # Create Opportunity if none active exists
            if not contact.opportunities.filter(
                stage__in=['new', 'contacted', 'qualified', 'quotation_sent']
            ).exists():
                opportunity = Opportunity.objects.create(
                    contact=contact,
                    title=f"Opportunity - {contact.full_name}",
                    value=0,
                    stage="new",
                    probability=20,
                    expected_close_date=timezone.now().date() + timezone.timedelta(days=30),
                    created_by=request.user,
                    notes=f"Auto-created from CRM lead move - {timezone.now().date()}"
                )
                opp_id = opportunity.id
            else:
                opp_id = None

        return Response({
            "detail": "Successfully moved to Sales Team",
            "opportunity_id": opp_id,
            "message": "New opportunity created" if opp_id else "Existing opportunity found"
        })


class OpportunityViewSet(viewsets.ModelViewSet):
    """
    Sales Opportunities / Deals
    """
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Opportunity.objects.filter(
            contact__organization=self.request.user.organization
        ).select_related("contact", "created_by").prefetch_related("quotations")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def open(self, request):
        qs = self.get_queryset().exclude(stage__in=['won', 'lost'])
        return Response(self.get_serializer(qs, many=True, context={'request': request}).data)

    @action(detail=False, methods=["get"])
    def won(self, request):
        qs = self.get_queryset().filter(stage='won')
        return Response(self.get_serializer(qs, many=True, context={'request': request}).data)

    @action(detail=False, methods=["get"])
    def lost(self, request):
        qs = self.get_queryset().filter(stage='lost')
        return Response(self.get_serializer(qs, many=True, context={'request': request}).data)

    @action(detail=True, methods=["post"])
    def mark_won(self, request, pk=None):
        opp = self.get_object()
        if opp.stage in ['won', 'lost']:
            raise ValidationError(f"Already {opp.get_stage_display()}")

        with transaction.atomic():
            opp.stage = 'won'
            opp.actual_close_date = timezone.now().date()
            opp.save(update_fields=['stage', 'actual_close_date'])

            opp.contact.status = 'customer'
            opp.contact.save(update_fields=['status'])

        return Response({"detail": "Marked as Won"})

    @action(detail=True, methods=["post"])
    def mark_lost(self, request, pk=None):
        opp = self.get_object()
        if opp.stage in ['won', 'lost']:
            raise ValidationError(f"Already {opp.get_stage_display()}")

        with transaction.atomic():
            opp.stage = 'lost'
            opp.actual_close_date = timezone.now().date()
            opp.save(update_fields=['stage', 'actual_close_date'])

        return Response({"detail": "Marked as Lost"})

    @action(detail=True, methods=["post"])
    def create_quotation(self, request, pk=None):
        opp = self.get_object()

        if opp.stage not in ['qualified', 'quotation_sent']:
            raise ValidationError("Opportunity must be qualified to create quotation")

        quotation = Quotation.objects.create(
            opportunity=opp,
            number=f"QT-{timezone.now().strftime('%Y%m%d')}-{Quotation.objects.count()+1}",
            date=timezone.now().date(),
            expiry_date=timezone.now().date() + timezone.timedelta(days=30),
            created_by=request.user
        )

        return Response(
            QuotationSerializer(quotation, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Activity.objects.filter(
            opportunity__contact__organization=self.request.user.organization
        ).select_related("opportunity", "created_by")


class CallLogViewSet(viewsets.ModelViewSet):
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CallLog.objects.filter(
            contact__organization=self.request.user.organization
        ).select_related("contact", "called_by").order_by("-call_time")

    @transaction.atomic
    def perform_create(self, serializer):
        call = serializer.save(called_by=self.request.user)
        contact = call.contact

        # Status mapping from call result
        status_map = {
            'connected': 'contacted',
            'interested': 'interested',
            'not_interested': 'lost',
            'callback': 'follow_up',
        }

        new_status = status_map.get(call.result)
        if new_status:
            contact.status = new_status

            # Auto-schedule next follow-up
            days_map = {
                'callback': 2,
                'interested': 5,
                'contacted': 3,
                'not_interested': None,
            }
            days = days_map.get(call.result)
            if days:
                contact.next_follow_up = timezone.now().date() + timezone.timedelta(days=days)
            elif new_status == 'lost':
                contact.next_follow_up = None

            # Auto-create Opportunity for interested leads
            if new_status == 'interested' and not contact.opportunities.filter(
                stage__in=['new', 'contacted', 'qualified']
            ).exists():
                Opportunity.objects.create(
                    contact=contact,
                    title=f"Opportunity from call - {contact.full_name}",
                    value=0,
                    stage='new',
                    probability=20,
                    expected_close_date=timezone.now().date() + timezone.timedelta(days=30),
                    created_by=self.request.user
                )

            contact.save(update_fields=['status', 'next_follow_up'])

        return call


class QuotationViewSet(viewsets.ModelViewSet):
    """
    Manage Quotations (linked to Opportunities)
    """
    serializer_class = QuotationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Quotation.objects.filter(
            opportunity__contact__organization=self.request.user.organization
        ).select_related("opportunity", "created_by")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class QuotationItemViewSet(viewsets.ModelViewSet):
    serializer_class = QuotationItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return QuotationItem.objects.filter(
            quotation__opportunity__contact__organization=self.request.user.organization
        )
        
# apps/crm/views.py  (add this class)
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import IsAuthenticated
from .models import Customer
from .serializers import CustomerSerializer


class CustomerCreateView(CreateAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(
            organization=self.request.user.organization,
            created_by=self.request.user
        )