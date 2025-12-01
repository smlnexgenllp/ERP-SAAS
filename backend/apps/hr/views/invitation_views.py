# from rest_framework.views import APIView
# from rest_framework.response import Response
# from rest_framework import status
# from django.utils import timezone
# from datetime import timedelta
# from django.contrib.auth import get_user_model
# from django.views.decorators.csrf import csrf_exempt
# from django.utils.decorators import method_decorator
# # Optional: Used for sending email (requires configuration in settings.py)
# # from django.core.mail import send_mail 
# # from django.conf import settings 

# # Assuming the models are in the parent directory (..models)
# # from models import Invitation
# from apps.subscriptions.models import OrganizationUser

# from ..permissions import IsHRManagerOrAdmin
# # Assuming subscriptions models are correctly imported here
# from apps.subscriptions.models import OrganizationModule, Module

# User = get_user_model()


# def has_module_access(user, module_code):
#     """
#     Checks if the user's organization has the specified module enabled and active.
#     """
#     try:
#         # FIX 1: Use the correct plural reverse accessor and get the first result
#         org_user = user.organizationuser_set.first()
#         if org_user is None:
#             return False # No OrganizationUser record found
            
#     except AttributeError:
#         # Catches if the attribute 'organizationuser_set' doesn't exist
#         return False

#     return OrganizationModule.objects.filter(
#         organization=org_user.organization,
#         module__code=module_code,
#         is_active=True,
#     ).exists()
# # ---
# # Send Invitation View (REQUIRES PERMISSIONS)
# # ---

# # FIX: Add decorator to exempt CSRF for decoupled frontend/JWT usage
# @method_decorator(csrf_exempt, name='dispatch')
# class SendInvitationView(APIView):
#     # CRITICAL: This MUST remain to protect the API and enforce HR/Admin role.
#     permission_classes = [IsHRManagerOrAdmin] 

#     def post(self, request):
#         email = request.data.get("email")
#         role = request.data.get("role", "employee")
        
#         if not email:
#             return Response({"error": "Email is required"}, status=status.HTTP_400_BAD_REQUEST)

#         # 1. Module access check
#         if not has_module_access(request.user, "hr_management"):
#             return Response({"error": "You do not have access to the HR Management module"},
#                             status=status.HTTP_403_FORBIDDEN)
        
#         # 2. Retrieve OrganizationUser instance
#         try:
#             org_user_instance = request.user.organizationuser_set.first()
#             if org_user_instance is None:
#                 return Response({"error": "User profile not fully set up."}, 
#                                 status=status.HTTP_500_INTERNAL_SERVER_ERROR)
#         except AttributeError:
#             return Response({"error": "User profile not fully set up."}, 
#                             status=status.HTTP_500_INTERNAL_SERVER_ERROR)

#         # 3. Create Invitation
#         invite = Invitation.objects.create(
#             email=email,
#             organization=org_user_instance.organization, 
#             role=role,
#             expires_at=timezone.now() + timedelta(days=3),
#             invited_by=org_user_instance 
#         )
        
#         # TODO: Implement actual email sending here using send_mail
        
#         # Example for the TODO:
#         # accept_url = f"http://YOUR_FRONTEND_DOMAIN/accept-invite/{invite.token}"
#         # send_mail('Invitation', f'Link: {accept_url}', settings.EMAIL_HOST_USER, [invite.email])
#         accept_url = f"http://localhost:3000/accept-invite/{invite.token}"
#         try:
#             send_mail(
#                 'You are invited to join the ERP system!',
#                 f'Please click the following link to set your password and join: {accept_url}\nThis link expires on {invite.expires_at.strftime("%Y-%m-%d")}.',
#                 settings.EMAIL_HOST_USER,  # The 'from' address defined in settings.py
#                 [invite.email],            # The recipient's email
#                 fail_silently=False,
#             )
#     # If successful, you can update the message in the response
#             response_message = "Invitation sent successfully via email."
#         except Exception as e:
#             response_message = f"Invitation created, but failed to send email: {e}"
#         return Response({"message": response_message, "token": invite.token}, status=status.HTTP_201_CREATED)
        
#         # return Response({"message": "Invitation sent", "token": invite.token}, status=status.HTTP_201_CREATED)

# # ---
# # Accept Invitation View (NO PERMISSIONS NEEDED)
# # ---

# class AcceptInvitationView(APIView):
#     """
#     Endpoint to accept an invitation, create a new User, and link them to an OrganizationUser.
#     """
#     # CORRECT: No permissions needed for new users
#     permission_classes = [] 

#     # Recommended: Add CSRF exemption here too, as this is also a POST from an external link
#     @method_decorator(csrf_exempt, name='dispatch')
#     def post(self, request, token):
#         try:
#             # Check for token existence and if it's already accepted
#             invite = Invitation.objects.get(token=token, accepted=False)
#         except Invitation.DoesNotExist:
#             return Response({"error": "Invalid or expired token"}, status=status.HTTP_400_BAD_REQUEST)

#         # CRITICAL SECURITY CHECK: Check for expiration
#         if invite.expires_at < timezone.now():
#              # Mark as expired if necessary, or just return an error
#              return Response({"error": "Invitation link has expired."}, status=status.HTTP_400_BAD_REQUEST)

#         password = request.data.get("password")
#         if not password:
#             return Response({"error": "Password is required"}, status=status.HTTP_400_BAD_REQUEST)

#         # Basic username creation from email
#         username = invite.email.split("@")[0]
        
#         # FIX: Check if a user with this email already exists before creating a new one
#         if User.objects.filter(email=invite.email).exists():
#             return Response({"error": "A user with this email already exists."}, status=status.HTTP_409_CONFLICT)


#         # Create new Django User
#         user = User.objects.create_user(
#             username=username,
#             email=invite.email,
#             password=password
#         )

#         # Create linked OrganizationUser
#         OrganizationUser.objects.create(
#             user=user,
#             organization=invite.organization,
#             role=invite.role
#         )

#         invite.accepted = True
#         invite.save()

#         return Response({"message": "Account created"}, status=status.HTTP_201_CREATED)