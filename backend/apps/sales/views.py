from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.crm.models import Contact
from apps.crm.serializers import ContactSerializer


class QualifiedLeadsListView(APIView):

    def get(self, request):

        leads = Contact.objects.filter(
            organization=request.user.organization,
            status="qualified"
        ).order_by("-created_at")

        serializer = ContactSerializer(leads, many=True)

        return Response(serializer.data)


class QualifiedLeadDetailView(APIView):

    def get(self, request, id):

        lead = Contact.objects.filter(
            organization=request.user.organization
        ).get(id=id)

        serializer = ContactSerializer(lead)

        return Response(serializer.data)