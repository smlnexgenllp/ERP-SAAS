from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from ..models import Invitation, OrganizationUser
from ..permissions import IsHRManagerOrAdmin

class SendInvitationView(APIView):
    permission_classes = [IsHRManagerOrAdmin]

    def post(self, request):
        email = request.data.get("email")

        invite = Invitation.objects.create(
            email=email,
            organization=request.user.orguser.organization,
            role="employee",
            expires_at=timezone.now() + timedelta(days=3),
            invited_by=request.user.orguser
        )

        # TODO: Send email here
        return Response({"message": "Invitation sent", "token": invite.token})
class AcceptInvitationView(APIView):
    def post(self, request, token):

        try:
            invite = Invitation.objects.get(token=token, accepted=False)
        except Invitation.DoesNotExist:
            return Response({"error": "Invalid token"}, status=400)

        password = request.data.get("password")
        username = invite.email.split("@")[0]

        user = User.objects.create_user(username=username, email=invite.email, password=password)

        org_user = OrganizationUser.objects.create(
            user=user,
            organization=invite.organization,
            role=invite.role
        )

        invite.accepted = True
        invite.save()

        return Response({"message": "Account created"})
