# apps/crm/views.py
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import Contact, Opportunity
from .serializers import ContactSerializer, OpportunitySerializer

class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [AllowAny]
    queryset = Contact.objects.all()
    def get_queryset(self):
        # Match your finance pattern — filter by current organization
        org = getattr(self.request, 'user_current_organization', None)
        if not org:
            return Contact.objects.none()
        return Contact.objects.filter(organization=org)

    def perform_create(self, serializer):
        org = getattr(self.request, 'user_current_organization', None)
        serializer.save(organization=org, created_by=self.request.user)

class OpportunityViewSet(viewsets.ModelViewSet):
    serializer_class = OpportunitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        org = getattr(self.request, 'user_current_organization', None)
        if not org:
            return Opportunity.objects.none()
        return Opportunity.objects.filter(contact__organization=org)