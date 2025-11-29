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
from .services import OrganizationService, ModuleAccessService
from rest_framework.decorators import api_view, permission_classes


# Import serializers directly to avoid circular imports
from .serializers import (
    OrganizationSerializer, 
    OrganizationRegistrationSerializer,
    SubOrganizationSerializer, 
    ModuleAccessSerializer,
    SubOrganizationCreationSerializer
)

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

class SubOrganizationCreationView(generics.CreateAPIView):
    """Create sub-organization with module access"""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SubOrganizationCreationSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            if not hasattr(request.user, 'organization') or not request.user.organization:
                return Response({
                    'success': False,
                    'error': 'User has no organization'
                }, status=status.HTTP_400_BAD_REQUEST)

            main_organization = request.user.organization

            # Prepare organization data
            organization_data = {
                'name': serializer.validated_data['name'],
                'subdomain': serializer.validated_data['subdomain'],
                'plan_tier': serializer.validated_data.get('plan_tier', 'basic'),
                'email': serializer.validated_data['email'],
                'phone': serializer.validated_data.get('phone', ''),
                'address': serializer.validated_data.get('address', ''),
            }

            # Prepare admin user data
            admin_data = {
                'email': serializer.validated_data['admin_email'],
                'password': serializer.validated_data['admin_password'],
                'first_name': serializer.validated_data['admin_first_name'],
                'last_name': serializer.validated_data.get('admin_last_name', ''),
            }

            # Get module access from validated data
            module_access = serializer.validated_data.get('module_access', [])
            
            print(f"🔍 Module access from request: {module_access}")  # Debug
            print(f"🔍 Module access type: {type(module_access)}")  # Debug

            # Create sub-organization
            sub_organization, admin_user = OrganizationService.create_sub_organization(
                main_organization=main_organization,
                organization_data=organization_data,
                admin_user_data=admin_data,
                module_access=module_access
            )

            return Response({
                'success': True,
                'message': 'Sub-organization created successfully',
                'organization': OrganizationSerializer(sub_organization).data,
                'user': {
                    'id': admin_user.id,
                    'email': admin_user.email,
                    'first_name': admin_user.first_name,
                    'last_name': admin_user.last_name,
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"❌ Error creating sub-organization: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class MainOrganizationViewSet(viewsets.ViewSet):
    """Views for main organization admin dashboard"""
    permission_classes = [permissions.IsAuthenticated]
    
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
    
    # In your views.py - update the available_modules action
    @action(detail=False, methods=['get'])
    def available_modules(self, request):
        """Get available modules for the current organization"""
        try:
            if not hasattr(request.user, 'organization') or not request.user.organization:
                return Response({
                    'success': False,
                    'error': 'User has no organization'
                }, status=status.HTTP_400_BAD_REQUEST)
                    
            current_organization = request.user.organization
            current_user = request.user
            
            print(f"🔍 Fetching modules for organization: {current_organization.name}")
            print(f"🔍 Current user: {current_user.email}, Role: {current_user.role}")
            
            # Get modules that this organization has access to
            org_modules = OrganizationModule.objects.filter(
                organization=current_organization,
                is_active=True
            ).select_related('module')
            
            print(f"🔍 Found {org_modules.count()} OrganizationModule records")
            
            modules_data = []
            
            for org_module in org_modules:
                module = org_module.module
                print(f"🔍 Processing module: {module.name}, Active: {module.is_active}")
                
                # Only include active modules
                if module.is_active:
                    module_data = {
                        'module_id': str(module.module_id),
                        'name': module.name,
                        'code': module.code,
                        'description': module.description,
                        'icon': module.icon,
                        'available_in_plans': module.available_in_plans,
                        'app_name': module.app_name,
                        'base_url': module.base_url,
                        'is_active': True,  # Always true since they have access
                        'pages': []
                    }
                    
                    # Add accessible pages
                    for page_id in org_module.accessible_pages:
                        try:
                            page = ModulePage.objects.get(page_id=page_id, is_active=True)
                            page_data = {
                                'page_id': str(page.page_id),
                                'name': page.name,
                                'code': page.code,
                                'path': page.path,
                                'description': page.description,
                                'icon': page.icon,
                                'order': page.order,
                                'required_permission': page.required_permission
                            }
                            module_data['pages'].append(page_data)
                        except ModulePage.DoesNotExist:
                            print(f"❌ Page not found: {page_id}")
                            continue
                    
                    modules_data.append(module_data)
                    print(f"✅ Added module to response: {module.name}")
                else:
                    print(f"❌ Module not active: {module.name}")
            
            print(f"📦 Returning {len(modules_data)} accessible modules for {current_organization.name}")
            
            return Response({
                'success': True,
                'data': modules_data,
                'count': len(modules_data)
            })
            
        except Exception as e:
            print(f"💥 Error in available_modules: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'], url_path='sub-org-modules')
    def sub_org_available_modules(self, request):
        """Get available modules specifically for sub-organizations"""
        try:
            if not hasattr(request.user, 'organization') or not request.user.organization:
                return Response({
                    'success': False,
                    'error': 'User has no organization'
                }, status=status.HTTP_400_BAD_REQUEST)
                    
            current_organization = request.user.organization
            
            # Only allow sub-organizations
            if current_organization.organization_type != 'sub':
                return Response({
                    'success': False,
                    'error': 'This endpoint is for sub-organizations only'
                }, status=status.HTTP_403_FORBIDDEN)
            
            print(f"🔍 Fetching modules for SUB-organization: {current_organization.name}")
            
            # Get modules that this sub-organization has access to
            org_modules = OrganizationModule.objects.filter(
                organization=current_organization,
                is_active=True
            ).select_related('module')
            
            modules_data = []
            
            for org_module in org_modules:
                module = org_module.module
                if module.is_active:
                    module_data = {
                        'module_id': str(module.module_id),
                        'name': module.name,
                        'code': module.code,
                        'description': module.description,
                        'icon': module.icon,
                        'available_in_plans': module.available_in_plans,
                        'app_name': module.app_name,
                        'base_url': module.base_url,
                        'is_active': True,
                        'pages': []
                    }
                    
                    # Add accessible pages
                    for page_id in org_module.accessible_pages:
                        try:
                            page = ModulePage.objects.get(page_id=page_id, is_active=True)
                            page_data = {
                                'page_id': str(page.page_id),
                                'name': page.name,
                                'code': page.code,
                                'path': page.path,
                                'description': page.description,
                                'icon': page.icon,
                                'order': page.order,
                                'required_permission': page.required_permission
                            }
                            module_data['pages'].append(page_data)
                        except ModulePage.DoesNotExist:
                            continue
                    
                    modules_data.append(module_data)
            
            print(f"📦 Found {len(modules_data)} modules for sub-org {current_organization.name}")
            
            return Response({
                'success': True,
                'data': modules_data,
                'count': len(modules_data)
            })
            
        except Exception as e:
            print(f"💥 Error in sub_org_available_modules: {str(e)}")
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)          

# Add the debug view at the end of the file

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def debug_modules_data(request):
    """Debug endpoint to check module data"""
    from apps.subscriptions.models import Module, SubscriptionPlan
    
    plans = SubscriptionPlan.objects.all()
    all_modules = Module.objects.all()
    
    result = {
        'plans': [],
        'modules': [],
        'modules_by_plan': {}
    }
    
    # Add plans
    for plan in plans:
        result['plans'].append({
            'id': plan.id,
            'name': plan.name,
            'code': plan.code,
            'is_active': plan.is_active
        })
    
    # Add all modules
    for module in all_modules:
        module_data = {
            'id': module.id,
            'name': module.name,
            'code': module.code,
            'available_in_plans': module.available_in_plans,
            'is_active': module.is_active,
            'pages_count': module.pages.count()
        }
        result['modules'].append(module_data)
    
    # Add modules by plan
    for plan in plans:
        plan_modules = []
        for module in all_modules:
            if module.available_in_plans and plan.code.lower() in [p.lower() for p in module.available_in_plans]:
                plan_modules.append({
                    'name': module.name,
                    'code': module.code
                })
        result['modules_by_plan'][plan.code] = plan_modules
    
    return Response(result)


    
