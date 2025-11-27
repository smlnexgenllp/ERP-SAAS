from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
# --- FIXED: Added missing Subscription/Module imports ---
from apps.subscriptions.models import OrganizationModule, Module, Subscription, SubscriptionPlan 
# --------------------------------------------------------
from .models import Organization
from .permissions import IsMainOrganizationAdmin
from .services import OrganizationService, ModuleAccessService
from .serializers import (
    OrganizationSerializer, 
    OrganizationRegistrationSerializer,
    SubOrganizationSerializer, 
    ModuleAccessSerializer,
    # NOTE: Assuming you have created this serializer for the POST request data
    SubOrganizationCreateSerializer 
)
from .permissions import IsMainOrganizationAdmin
from .services import OrganizationService, ModuleAccessService

# Initialize User Model
User = get_user_model()


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
            
            # This service call should handle all creation (Org, User, Subscription, Modules)
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
    # NOTE: Re-enabling the correct permission after testing is crucial for security
    permission_classes = [permissions.IsAuthenticated, IsMainOrganizationAdmin] 
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get main organization dashboard data"""
        try:
            user = request.user
        
        # 1. Permission/Organization Check (Prevents crash if user isn't fully linked)
            if not hasattr(user, 'organization') or not user.organization or user.organization.organization_type != 'main':
                return Response({
                    'success': False,
                    'error': 'User is not linked to a Main Organization.'
                }, status=status.HTTP_403_FORBIDDEN)
            
            main_organization = user.organization
        
        # 2. Safely retrieve metrics (CRASH PREVENTION)
        # Use a safe method to count sub-organizations, ensuring the manager exists.
            sub_org_count = main_organization.sub_organizations.count() if hasattr(main_organization, 'sub_organizations') else 0
        
        # Count total users in the main organization (assuming 'organization' is a FK on the User model)
            total_users_count = User.objects.filter(organization=main_organization).count()

        # Count active modules assigned to the main organization
            active_modules_count = OrganizationModule.objects.filter(
                organization=main_organization,
                is_active=True
            ).count()
        
        # 3. Construct the response data
            dashboard_data = {
                'main_organization': {
                    'id': main_organization.id,
                    'name': main_organization.name,
                    'plan_tier': main_organization.plan_tier,
                    'sub_organizations_count': sub_org_count,
                    'total_users_count': total_users_count,
                    'active_modules_count': active_modules_count,
                # Add any other required metrics here
                },
            # These lists are usually retrieved via other endpoints, but we include them for completeness
                'sub_organizations': [], 
                'available_modules': []
            }
        
            return Response({
                'success': True,
                'data': dashboard_data
            })
        
        except Exception as e:
            # 4. Catch all errors and log them (This is where you see the failure in your console)
            # NOTE: Check your server console for the traceback printed before this line!
            return Response({
                'success': False,
                'error': f"Dashboard data retrieval failed: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
    # ... (get_queryset, dashboard, sub_organizations_list, available_modules remain the same) ...
    @action(detail=False, methods=['get'])
    def sub_organizations_list(self, request):
        """Get list of all sub-organizations with basic info"""
        try:
            # ... (rest of logic) ...
            
            main_organization = request.user.organization
            
            sub_organizations = main_organization.sub_organizations.all()
            serializer = SubOrganizationSerializer(sub_organizations, many=True)
            
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # --- FIX 2: available_modules ---
    @action(detail=False, methods=['get'])
    def available_modules(self, request):
        """Get all available modules with pages"""
        try:
            # ... (rest of logic) ...

            # Get modules using ModuleAccessService
            modules_data = ModuleAccessService.get_all_modules_with_pages()
            
            return Response({
                'success': True,
                'data': modules_data
            })
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    @action(detail=False, methods=['post'], url_path='sub-organizations/(?P<sub_org_id>[^/.]+)/module-access')
    @transaction.atomic
    def update_module_access(self, request, sub_org_id=None):
        """Update module access for a sub-organization"""
        try:
            user = request.user
            if not user.organization or not user.organization.is_main_organization:
                 return Response({'success': False, 'error': 'Not a Main Organization Admin'}, status=status.HTTP_403_FORBIDDEN)
            
            main_organization = user.organization
            
            try:
                # Restrict to sub-organizations owned by the main org
                sub_organization = main_organization.sub_organizations.get(id=sub_org_id)
            except Organization.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Sub-organization not found or does not belong to main organization'
                }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = ModuleAccessSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # --- FIXED: Correctly extract and process data from the validated serializer ---
            module_access_data = serializer.validated_data['module_access']
            
            module_codes = []
            accessible_pages_map = {}
            
            for code, access in module_access_data.items():
                if access.get('is_active'):
                    module_codes.append(code)
                    if 'accessible_pages' in access:
                        accessible_pages_map[code] = access['accessible_pages'] 

            # Update module access using service
            ModuleAccessService.assign_modules_to_organization(
                organization=sub_organization, 
                module_codes=module_codes,
                accessible_pages_map=accessible_pages_map,
                granted_by=user
            )
            # --- END FIXED LOGIC ---
            
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
    
    # ... (sub_organization_detail remains the same) ...

    @action(detail=False, methods=['post'], url_path='sub-organizations')
    @transaction.atomic
    def create_sub_organization(self, request):
        """Creates a new sub-organization, its admin, subscription, and assigns modules."""
        try:
            user = request.user
            if not user.organization or not user.organization.is_main_organization:
                 return Response({'success': False, 'error': 'Not a Main Organization Admin'}, status=status.HTTP_403_FORBIDDEN)

            # NOTE: Assuming SubOrganizationCreateSerializer is imported/defined
            serializer = SubOrganizationCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data

            # 1. Create Sub-organization
            sub_org = Organization.objects.create(
                name=data['name'],
                subdomain=data['subdomain'],
                organization_type='sub', # <-- CRITICAL FIX: Set type to 'sub'
                plan_tier=data.get('plan_tier', 'basic'),
                email=data['email'],
                phone=data.get('phone', ''),
                address=data.get('address', ''),
                parent_organization=user.organization,
                created_by=user
            )
            
            # 2. Create Admin User
            admin_user = User.objects.create_user(
                username=data['admin_email'], # Use email as username
                email=data['admin_email'],
                password=data['admin_password'],
                first_name=data['admin_first_name'],
                last_name=data.get('admin_last_name', ''),
                organization=sub_org,
                role=User.SUB_ORG_ADMIN # Assuming this role exists
            )

            # 3. Create Subscription (MIMICING LOGIC from main org creation)
            try:
                plan = SubscriptionPlan.objects.get(code__iexact=sub_org.plan_tier)
            except SubscriptionPlan.DoesNotExist:
                plan = SubscriptionPlan.objects.filter(is_active=True).first()
                if not plan:
                    plan = SubscriptionPlan.objects.create(name='Basic', code='basic', price=50, is_active=True)

            Subscription.objects.create(
                organization=sub_org,
                plan=plan,
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=30),
                status='active',
                is_trial=True
            )

            # 4. Assign selected modules
            selected_modules = data.get('selected_modules', [])
            if selected_modules:
                # --- CRITICAL FIX: Use the service layer correctly ---
                ModuleAccessService.assign_modules_to_organization(
                    organization=sub_org, 
                    module_codes=selected_modules,
                    granted_by=user
                )
                # --- END FIXED LOGIC ---

            return Response({
                'success': True,
                'message': 'Sub-organization created successfully',
                'sub_organization': SubOrganizationSerializer(sub_org).data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                'success': False, 
                'error': f"Failed to create sub-organization: {str(e)}"
            }, status=status.HTTP_400_BAD_REQUEST)