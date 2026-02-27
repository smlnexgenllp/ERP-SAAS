# apps/crm/views.py

from django.utils import timezone
from django.db.models import Count
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Contact, Opportunity, CallLog
from .serializers import (
    ContactSerializer,
    OpportunitySerializer,
    CallLogSerializer
)


# =====================================================
# CONTACT VIEWSET
# =====================================================

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

    # --------- FILTER ACTIONS ---------

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
        qs = self.get_queryset().filter(
            next_follow_up__lte=now
        )
        return Response(self.get_serializer(qs, many=True).data)

    @action(detail=True, methods=["post"])
    def convert_to_customer(self, request, pk=None):
        contact = self.get_object()

        if contact.status == "customer":
            return Response(
                {"error": "Already a customer"},
                status=status.HTTP_400_BAD_REQUEST
            )

        contact.status = "customer"
        contact.save(update_fields=["status"])

        return Response({"message": "Converted to customer"})


# =====================================================
# OPPORTUNITY VIEWSET
# =====================================================

class OpportunityViewSet(viewsets.ModelViewSet):
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Opportunity.objects.filter(
            contact__organization=self.request.user.organization
        ).select_related(
            "contact",
            "created_by"
        ).order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    # --------- FILTER ACTIONS ---------

    @action(detail=False, methods=["get"])
    def open(self, request):
        qs = self.get_queryset().exclude(
            stage__in=[Opportunity.Stage.WON, Opportunity.Stage.LOST]
        )
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
        stats = self.get_queryset().values("stage").annotate(
            count=Count("id")
        )
        return Response(stats)

    # --------- STATE CHANGE ACTIONS ---------

    @action(detail=True, methods=["post"])
    def mark_won(self, request, pk=None):
        opportunity = self.get_object()

        if opportunity.stage in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            return Response(
                {"error": f"Already {opportunity.stage}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        opportunity.stage = Opportunity.Stage.WON
        opportunity.actual_close_date = timezone.now().date()
        opportunity.save(update_fields=["stage", "actual_close_date"])

        # 🔥 Auto convert contact to customer
        opportunity.contact.status = "customer"
        opportunity.contact.save(update_fields=["status"])

        return Response({"message": "Marked as WON"})

    @action(detail=True, methods=["post"])
    def mark_lost(self, request, pk=None):
        opportunity = self.get_object()

        if opportunity.stage in [Opportunity.Stage.WON, Opportunity.Stage.LOST]:
            return Response(
                {"error": f"Already {opportunity.stage}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        opportunity.stage = Opportunity.Stage.LOST
        opportunity.actual_close_date = timezone.now().date()
        opportunity.save(update_fields=["stage", "actual_close_date"])

        # 🔥 Update contact
        opportunity.contact.status = "lost"
        opportunity.contact.save(update_fields=["status"])

        return Response({"message": "Marked as LOST"})

    @action(detail=True, methods=["post"])
    def reopen(self, request, pk=None):
        opportunity = self.get_object()

        if opportunity.stage not in [
            Opportunity.Stage.WON,
            Opportunity.Stage.LOST,
        ]:
            return Response(
                {"error": "Only won/lost opportunities can be reopened"},
                status=status.HTTP_400_BAD_REQUEST
            )

        opportunity.stage = Opportunity.Stage.NEW
        opportunity.actual_close_date = None
        opportunity.save(update_fields=["stage", "actual_close_date"])

        return Response({"message": "Opportunity reopened"})


# =====================================================
# CALL LOG VIEWSET
# =====================================================

class CallLogViewSet(viewsets.ModelViewSet):
    serializer_class = CallLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CallLog.objects.filter(
            contact__organization=self.request.user.organization
        ).select_related("contact", "called_by")

    def perform_create(self, serializer):
        call = serializer.save(called_by=self.request.user)
        contact = call.contact

        # 🔥 AUTOMATIC STATUS FLOW

        if call.result == "connected":
            contact.status = "contacted"

        elif call.result == "interested":
            contact.status = "interested"

            # Auto create opportunity if none open
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