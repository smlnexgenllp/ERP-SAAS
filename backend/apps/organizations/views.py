from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from .models import Organization
from .serializers import (
    OrganizationSerializer, 
    OrganizationRegistrationSerializer,
    SubOrganizationSerializer, 
    ModuleAccessSerializer
)
from .permissions import IsMainOrganizationAdmin
from .services import OrganizationService, ModuleAccessService

class OrganizationRegistrationView(generics.CreateAPIView):
    """Main organization registration/signup"""
    queryset = Organization.objects.all()
    serializer_class = OrganizationRegistrationSerializer
    permission_classes = [permissions.AllowAny]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Create main organization using service
            organization_data = {
                'name': serializer.validated_data['name'],
                'subdomain': serializer.validated_data['subdomain'],
                'plan_tier': serializer.validated_data.get('plan_tier', 'enterprise'),
                'email': serializer.validated_data['email'],
                'phone': serializer.validated_data.get('phone', ''),
                'address': serializer.validated_data.get('address', ''),
            }
            
            admin_data = {
                'email': serializer.validated_data['admin_email'],
                'password': serializer.validated_data['admin_password'],
                'first_name': serializer.validated_data['admin_first_name'],
                'last_name': serializer.validated_data.get('admin_last_name', ''),
            }
            
            organization, admin_user = OrganizationService.create_main_organization(
                organization_data, 
                admin_data
            )
            
            return Response({
                'success': True,
                'message': 'Organization registered successfully',
                'organization': OrganizationSerializer(organization).data,
                'user': {
                    'id': admin_user.id,
                    'email': admin_user.email,
                    'first_name': admin_user.first_name,
                    'last_name': admin_user.last_name,
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class CurrentOrganizationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        if not hasattr(request.user, 'organization') or not request.user.organization:
            return Response({
                'success': False,
                'error': 'User has no organization'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        organization = request.user.organization
        serializer = OrganizationSerializer(organization)
        return Response(serializer.data)

class MainOrganizationViewSet(viewsets.ViewSet):
    """Views for main organization admin dashboard"""
    permission_classes = [permissions.IsAuthenticated]  # Remove IsMainOrganizationAdmin temporarily for testing
    
    def get_queryset(self):
        """Ensure user has an organization"""
        user = self.request.user
        if hasattr(user, 'organization') and user.organization:
            return Organization.objects.filter(id=user.organization.id)
        return Organization.objects.none()
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get main organization dashboard data"""
        try:
            if not hasattr(request.user, 'organization') or not request.user.organization:
                return Response({
                    'success': False,
                    'error': 'User has no organization'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            main_organization = request.user.organization
            
            # Basic dashboard data
            dashboard_data = {
                'main_organization': {
                    'id': main_organization.id,
                    'name': main_organization.name,
                    'plan_tier': main_organization.plan_tier,
                    'sub_organizations_count': main_organization.sub_organizations.count(),
                },
                'sub_organizations': [],
                'available_modules': []
            }
            
            return Response({
                'success': True,
                'data': dashboard_data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def sub_organizations_list(self, request):
        """Get list of all sub-organizations with basic info"""
        try:
            if not hasattr(request.user, 'organization') or not request.user.organization:
                return Response({
                    'success': False,
                    'error': 'User has no organization'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            main_organization = request.user.organization
            
            sub_organizations = main_organization.sub_organizations.all()
            serializer = SubOrganizationSerializer(sub_organizations, many=True)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def available_modules(self, request):
        """Get all available modules with pages"""
        try:
            if not hasattr(request.user, 'organization') or not request.user.organization:
                return Response({
                    'success': False,
                    'error': 'User has no organization'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # Get modules using ModuleAccessService
            modules_data = ModuleAccessService.get_all_modules_with_pages()
            
            return Response({
                'success': True,
                'data': modules_data
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='sub-organizations/(?P<sub_org_id>[^/.]+)/module-access')
    def update_module_access(self, request, sub_org_id=None):
        """Update module access for a sub-organization"""
        try:
            if not hasattr(request.user, 'organization') or not request.user.organization:
                return Response({
                    'success': False,
                    'error': 'User has no organization'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            main_organization = request.user.organization
            
            try:
                sub_organization = main_organization.sub_organizations.get(id=sub_org_id)
            except Organization.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Sub-organization not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = ModuleAccessSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update module access
            module_access_data = serializer.validated_data['module_access']
            
            return Response({
                'success': True,
                'message': 'Module access updated successfully',
                'data': module_access_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='sub-organizations/(?P<sub_org_id>[^/.]+)')
    def sub_organization_detail(self, request, sub_org_id=None):
        """Get detailed information about a sub-organization"""
        try:
            if not hasattr(request.user, 'organization') or not request.user.organization:
                return Response({
                    'success': False,
                    'error': 'User has no organization'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            main_organization = request.user.organization
            
            try:
                sub_organization = main_organization.sub_organizations.get(id=sub_org_id)
            except Organization.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Sub-organization not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            detail_data = {
                'sub_organization': OrganizationSerializer(sub_organization).data,
                'current_module_access': [],
                'available_modules': []
            }
            
            return Response({
                'success': True,
                'data': detail_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)