from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from .models import User
import logging

logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """User login view"""
    username = request.data.get('username')
    password = request.data.get('password')

    print(f"🔐 Login attempt for: {username}")  # Debug

    if not username or not password:
        return Response({
            'success': False,
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Try to find user by email first, then by username
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

        # Check if user is active
        if not user.is_active:
            print(f"❌ User account inactive: {username}")
            return Response({
                'success': False,
                'error': 'Account is disabled'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check password
        if user.check_password(password):
            print(f"✅ Password correct for: {username}")
            
            # Use Django's login function to create session
            login(request, user)
            print(f"✅ Session created for: {username}")
            
            # Get organization details
            organization_data = None
            if user.organization:
                organization_data = {
                    'id': user.organization.id,
                    'name': user.organization.name,
                    'subdomain': user.organization.subdomain,
                    'type': user.organization.organization_type,
                }
                print(f"🏢 Organization: {user.organization.name}")
            
            return Response({
                'success': True,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'role': user.role,
                    'is_verified': user.is_verified,
                },
                'organization': organization_data,
                'message': 'Login successful'
            })
        else:
            print(f"❌ Invalid password for: {username}")
            return Response({
                'success': False,
                'error': 'Invalid credentials'
            }, status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        print(f"💥 Login error: {str(e)}")
        return Response({
            'success': False,
            'error': f'Login failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """User logout view"""
    print(f"👋 Logging out user: {request.user.email}")
    logout(request)
    return Response({
        'success': True,
        'message': 'Logout successful'
    })

@api_view(['GET'])
def current_user_view(request):
    """Get current user information"""
    if not request.user.is_authenticated:
        return Response({
            'success': False,
            'error': 'Not authenticated'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    user = request.user
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
            'role': user.role,
            'is_verified': user.is_verified,
        },
        'organization': organization_data
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_csrf_token(request):
    """Get CSRF token for React"""
    return Response({
        'csrfToken': get_token(request)
    })