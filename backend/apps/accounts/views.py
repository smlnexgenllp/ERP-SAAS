# apps/accounts/views.py (or wherever your auth views are)

from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from .models import User
from apps.organizations.models import OrganizationUser  # ← Adjust path if needed
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    print(f"🔐 Login attempt for: {username}")

    if not username or not password:
        return Response({
            'success': False,
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Find user by email or username
        try:
            user = User.objects.get(email=username)
            print(f"✅ User found by email: {user.email}")
        except User.DoesNotExist:
            try:
                user = User.objects.get(username=username)
                print(f"✅ User found by username: {user.username}")
            except User.DoesNotExist:
                print(f"❌ User not found: {username}")
                return Response({
                    'success': False,
                    'error': 'Invalid credentials'
                }, status=status.HTTP_400_BAD_REQUEST)

        if not user.is_active:
            print(f"❌ Inactive account: {username}")
            return Response({
                'success': False,
                'error': 'Account is disabled'
            }, status=status.HTTP_400_BAD_REQUEST)

        if user.check_password(password):
            print(f"✅ Password correct for: {username}")
            login(request, user)
            print(f"✅ Session created")

            # === GET ORGANIZATION ROLE ===
            org_role = None
            try:
                org_user = OrganizationUser.objects.get(
                    user=user,
                    is_active=True
                )
                org_role = org_user.role  # "HR Manager", "Admin", "Employee"
                print(f"🏢 Org role: {org_role}")
            except OrganizationUser.DoesNotExist:
                print("⚠️ No OrganizationUser record found")
            except OrganizationUser.MultipleObjectsReturned:
                # Fallback to first active one
                org_user = OrganizationUser.objects.filter(user=user, is_active=True).first()
                org_role = org_user.role if org_user else None

            # === ORGANIZATION DATA ===
            organization_data = None
            if user.organization:
                organization_data = {
                    'id': user.organization.id,
                    'name': user.organization.name,
                    'subdomain': user.organization.subdomain,
                    'type': user.organization.organization_type,
                }

            return Response({
                'success': True,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,           # System role (super_admin, etc.)
                    'org_role': org_role,        # ← Job role (HR Manager, Admin, etc.)
                    'is_verified': user.is_verified,
                },
                'organization': organization_data,
                'message': 'Login successful'
            })
        else:
            print(f"❌ Wrong password")
            return Response({
                'success': False,
                'error': 'Invalid credentials'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        logger.error(f"Login exception: {str(e)}")
        return Response({
            'success': False,
            'error': 'Login failed. Please try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    print(f"👋 Logging out: {request.user.email}")
    logout(request)
    return Response({
        'success': True,
        'message': 'Logout successful'
    })


@api_view(['GET'])
def current_user_view(request):
    if not request.user.is_authenticated:
        return Response({
            'success': False,
            'error': 'Not authenticated'
        }, status=status.HTTP_401_UNAUTHORIZED)

    user = request.user

    # === GET ORGANIZATION ROLE (same logic as login) ===
    org_role = None
    try:
        org_user = OrganizationUser.objects.get(user=user, is_active=True)
        org_role = org_user.role
    except OrganizationUser.DoesNotExist:
        pass
    except OrganizationUser.MultipleObjectsReturned:
        org_user = OrganizationUser.objects.filter(user=user, is_active=True).first()
        org_role = org_user.role if org_user else None

    # === ORGANIZATION DATA ===
    organization_data = None
    if user.organization:
        organization_data = {
            'id': user.organization.id,
            'name': user.organization.name,
            'subdomain': user.organization.subdomain,
            'type': user.organization.organization_type,
        }

    return Response({
        'success': True,
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,           # System role
            'org_role': org_role,        # ← Job role (critical!)
            'is_verified': user.is_verified,
        },
        'organization': organization_data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_csrf_token(request):
    return Response({
        'csrfToken': get_token(request)
    })