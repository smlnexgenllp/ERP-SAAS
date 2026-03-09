# apps/crm/views.py

from django.utils import timezone
from django.db.models import Count, Sum, Q
from django.db import transaction
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import (
    Contact, Opportunity, CallLog, Product, Activity, Customer,
    Quotation, 
)
from .serializers import (
    ContactSerializer, OpportunitySerializer, CallLogSerializer,
    ProductSerializer, ActivitySerializer, CustomerSerializer,
    QuotationSerializer, 
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
        qs = self.get_queryset().exclude(status="customer")
        serializer = self.get_serializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def customers(self, request):
        qs = self.get_queryset().filter(status="customer")
        serializer = self.get_serializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def due_followups(self, request):
        """
        Returns contacts with next_follow_up <= today (overdue or due today)
        """
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
        contact = self.get_object()

        if contact.status == "customer":
            return Response(
                {"detail": "Contact is already a customer"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            contact.status = "customer"
            contact.save(update_fields=["status"])

            # Optional: ensure Customer profile exists
            Customer.objects.get_or_create(
                contact=contact,
                defaults={
                    "organization": contact.organization,
                    "created_by": request.user,
                    "customer_since": timezone.now().date(),
                }
            )

        return Response({"detail": "Contact successfully converted to customer"})
    # In ContactViewSet

    @action(detail=True, methods=["post"])
    def complete_followup(self, request, pk=None):
        contact = self.get_object()
        
        if not contact.next_follow_up:
            return Response({"detail": "No follow-up scheduled"}, status=400)
        
        with transaction.atomic():
            # Option A: Clear date (most common)
            contact.next_follow_up = None
            
            # Option B: Schedule next one automatically (uncomment if desired)
            # contact.next_follow_up = timezone.now().date() + timezone.timedelta(days=7)
            
            contact.save(update_fields=['next_follow_up'])
        
        return Response({"detail": "Follow-up marked as completed"})
    @action(detail=True, methods=["post"], url_path="move-to-sales")
    def move_to_sales(self, request, pk=None):
        contact = self.get_object()

        allowed_statuses = ["interested", "qualified"]
        if contact.status not in allowed_statuses:
            return Response(
                {"detail": f"Only contacts in {', '.join(allowed_statuses)} status can be moved to sales team"},
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Optional: update contact status
            contact.status = "qualified"  # or "in_sales"
            contact.save(update_fields=["status"])

            # Create Opportunity (deal) for sales team
            opportunity = Opportunity.objects.create(
                contact=contact,
                title=f"Deal - {contact.first_name} {contact.last_name or ''}",
                value=0,  # can be updated later
                stage="new",
                probability=20,
                expected_close_date=timezone.now().date() + timezone.timedelta(days=30),
                created_by=request.user,
                notes=f"Lead moved from CRM - Status was {contact.status}"
            )

        return Response({
            "detail": "Successfully moved to Sales Team",
            "opportunity_id": opportunity.id,
            "message": f"New opportunity created: {opportunity.title}"
        })

class OpportunityViewSet(viewsets.ModelViewSet):
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Opportunity.objects.filter(
            contact__organization=self.request.user.organization
        ).select_related(
            "contact", "created_by"
        ).prefetch_related(
            "quotations", "quotations__items"
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def open(self, request):
        qs = self.get_queryset().exclude(stage__in=[Opportunity.Stage.WON, Opportunity.Stage.LOST])
        serializer = self.get_serializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def won(self, request):
        qs = self.get_queryset().filter(stage=Opportunity.Stage.WON)
        serializer = self.get_serializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def lost(self, request):
        qs = self.get_queryset().filter(stage=Opportunity.Stage.LOST)
        serializer = self.get_serializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def high_value(self, request):
        threshold = float(request.query_params.get("threshold", 100000))
        qs = self.get_queryset().filter(value__gt=threshold)
        serializer = self.get_serializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_stage(self, request):
        stats = self.get_queryset().values("stage").annotate(count=Count("id")).order_by("stage")
        return Response(stats)

    @action(detail=True, methods=["post"])
    def mark_won(self, request, pk=None):
        opportunity = self.get_object()

        if opportunity.stage in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            raise ValidationError(f"Opportunity is already {opportunity.get_stage_display()}")

        with transaction.atomic():
            opportunity.stage = Opportunity.Stage.WON
            opportunity.actual_close_date = timezone.now().date()
            opportunity.save(update_fields=["stage", "actual_close_date"])

            # Auto-upgrade contact
            opportunity.contact.status = "customer"
            opportunity.contact.save(update_fields=["status"])

        return Response({"detail": "Opportunity marked as Won"})

    @action(detail=True, methods=["post"])
    def mark_lost(self, request, pk=None):
        opportunity = self.get_object()

        if opportunity.stage in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            raise ValidationError(f"Opportunity is already {opportunity.get_stage_display()}")

        with transaction.atomic():
            opportunity.stage = Opportunity.Stage.LOST
            opportunity.actual_close_date = timezone.now().date()
            opportunity.save(update_fields=["stage", "actual_close_date"])

            opportunity.contact.status = "lost"
            opportunity.contact.save(update_fields=["status"])

        return Response({"detail": "Opportunity marked as Lost"})

    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        opportunity = self.get_object()

        if opportunity.stage not in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            raise ValidationError("Only closed (Won/Lost) opportunities can be reopened")

        opportunity.stage = Opportunity.Stage.NEW
        opportunity.actual_close_date = None
        opportunity.save(update_fields=["stage", "actual_close_date"])

        return Response({"detail": "Opportunity has been reopened"})

    @action(detail=True, methods=["post"])
    def create_quotation(self, request, pk=None):
        opportunity = self.get_object()

        if opportunity.stage != Opportunity.Stage.QUALIFIED:
            raise ValidationError("Opportunity must be in QUALIFIED stage to create quotation")

        quotation = Quotation.objects.create(
            opportunity=opportunity,
            created_by=request.user,
            # You might want to copy more fields from opportunity here
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

    # apps/crm/views.py → CallLogViewSet

    @transaction.atomic
    def perform_create(self, serializer):
        call = serializer.save(called_by=self.request.user)
        contact = call.contact

        status_map = {
            "connected": "contacted",
            "interested": "interested",
            "not_interested": "lost",
            "callback": "follow_up",
        }

        new_status = status_map.get(call.result)
        if new_status:
            contact.status = new_status

            # ────── AUTO-SCHEDULE FOLLOW-UP LOGIC ──────
            days_ahead = 3  # default

            if new_status == "callback":
                days_ahead = 2
            elif new_status == "interested":
                days_ahead = 5  # give more time for interested leads
            elif new_status == "contacted":
                days_ahead = 3

            # Only set if no future date already exists or if overdue
            if not contact.next_follow_up or contact.next_follow_up < timezone.now().date():
                contact.next_follow_up = timezone.now().date() + timezone.timedelta(days=days_ahead)

            # For "not interested" → clear future follow-up
            if new_status == "lost":
                contact.next_follow_up = None

            # Auto-create Opportunity for interested leads if none exists
            if new_status == "interested" and not contact.opportunities.filter(
                stage__in=['new', 'contacted', 'qualified']
            ).exists():
                Opportunity.objects.create(
                    contact=contact,
                    title=f"Opportunity from call - {contact.first_name}",
                    value=0,
                    stage='new',
                    created_by=self.request.user
                )

            contact.save(update_fields=['status', 'next_follow_up'])

        return call

