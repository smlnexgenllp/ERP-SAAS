from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import transaction
from django.contrib.auth import get_user_model
from rest_framework.permissions import  AllowAny, IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from apps.subscriptions.models import OrganizationModule,ModulePage, Module, Subscription, SubscriptionPlan 
from apps.organizations.models import Organization
from .services import OrganizationService, ModuleAccessService
from .serializers import SubOrgUserCreateSerializer
from rest_framework.decorators import api_view, permission_classes
from .serializers import ( OrganizationSerializer,  OrganizationRegistrationSerializer, SubOrganizationSerializer, ModuleAccessSerializer,SubOrganizationCreationSerializer)
User = get_user_model()
from .models import Organization
from django.db import IntegrityError
from django.contrib.auth import get_user_model

class OrganizationRegistrationView(generics.CreateAPIView):
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
            organization_data = {
                'name': serializer.validated_data['name'],
                'subdomain': serializer.validated_data['subdomain'],
                'plan_tier': serializer.validated_data.get('plan_tier', 'basic'),
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
            module_access = serializer.validated_data.get('module_access', [])
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
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'organization') and user.organization:
            return Organization.objects.filter(id=user.organization.id)
        return Organization.objects.none()
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        try:
            user = request.user
            if not hasattr(user, 'organization') or not user.organization or user.organization.organization_type != 'main':
                return Response({
                    'success': False,
                    'error': 'User is not linked to a Main Organization.'
                }, status=status.HTTP_403_FORBIDDEN)
            main_organization = user.organization
            sub_org_count = main_organization.sub_organizations.count() if hasattr(main_organization, 'sub_organizations') else 0
            total_users_count = User.objects.filter(organization=main_organization).count()
            active_modules_count = OrganizationModule.objects.filter(
                organization=main_organization,
                is_active=True
            ).count()
            dashboard_data = {
                'main_organization': {
                    'id': main_organization.id,
                    'name': main_organization.name,
                    'plan_tier': main_organization.plan_tier,
                    'sub_organizations_count': sub_org_count,
                    'total_users_count': total_users_count,
                    'active_modules_count': active_modules_count,
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
                'error': f"Dashboard data retrieval failed: {str(e)}"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    @action(detail=False, methods=['get'])
    def sub_organizations_list(self, request):
        try:
            main_organization = request.user.organization
            sub_organizations = main_organization.sub_organizations.all()
            serializer = SubOrganizationSerializer(sub_organizations, many=True)
            return Response({
                'success': True,
                'data': serializer.data
            })
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    @action(detail=False, methods=['get'])
    def available_modules(self, request):
        try:
            if not hasattr(request.user, 'organization') or not request.user.organization:
                return Response({
                    'success': False,
                    'error': 'User has no organization'
                }, status=status.HTTP_400_BAD_REQUEST)
            current_organization = request.user.organization
            current_user = request.user
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
                        'is_active': True,  # Always true since they have access
                        'pages': []
                    }
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
        try:
            user = request.user
            if not user.organization or not user.organization.is_main_organization:
                 return Response({'success': False, 'error': 'Not a Main Organization Admin'}, status=status.HTTP_403_FORBIDDEN)
            main_organization = user.organization
            try:
                sub_organization = main_organization.sub_organizations.get(id=sub_org_id)
            except Organization.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Sub-organization not found or does not belong to main organization'
                }, status=status.HTTP_404_NOT_FOUND)
            serializer = ModuleAccessSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            module_access_data = serializer.validated_data['module_access']
            module_codes = []
            accessible_pages_map = {}
            for code, access in module_access_data.items():
                if access.get('is_active'):
                    module_codes.append(code)
                    if 'accessible_pages' in access:
                        accessible_pages_map[code] = access['accessible_pages'] 
            ModuleAccessService.assign_modules_to_organization(
                organization=sub_organization, 
                module_codes=module_codes,
                accessible_pages_map=accessible_pages_map,
                granted_by=user
            )
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
    @action(detail=False, methods=['post'], url_path='sub-organizations')
    @transaction.atomic
    def create_sub_organization(self, request):
        try:
            user = request.user
            if not user.organization or not user.organization.is_main_organization:
                 return Response({'success': False, 'error': 'Not a Main Organization Admin'}, status=status.HTTP_403_FORBIDDEN)
            serializer = SubOrganizationCreateSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            data = serializer.validated_data
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
            admin_user = User.objects.create_user(
                username=data['admin_email'], # Use email as username
                email=data['admin_email'],
                password=data['admin_password'],
                first_name=data['admin_first_name'],
                last_name=data.get('admin_last_name', ''),
                organization=sub_org,
                role=User.SUB_ORG_ADMIN # Assuming this role exists
            )
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
            selected_modules = data.get('selected_modules', [])
            if selected_modules:
                ModuleAccessService.assign_modules_to_organization(
                    organization=sub_org, 
                    module_codes=selected_modules,
                    granted_by=user
                )
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
        try:
            org = getattr(request.user, 'organization', None)
            if not org:
                return Response({'success': False, 'error': 'User has no organization'}, status=status.HTTP_400_BAD_REQUEST)
            if org.organization_type != 'sub':
                return Response({'success': False, 'error': 'This endpoint is only for sub-organizations'}, status=status.HTTP_403_FORBIDDEN)
            org_modules = OrganizationModule.objects.filter(organization=org, is_active=True).select_related('module')
            modules_data = []
            for org_module in org_modules:
                module = org_module.module
                if not org_module.is_active:
                    print(f"❌ Skipping inactive module: {module.name}")
                    continue
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
                for page_id in org_module.accessible_pages:
                    try:
                        page = ModulePage.objects.get(page_id=page_id, is_active=True)
                        module_data['pages'].append({
                            'page_id': str(page.page_id),
                            'name': page.name,
                            'code': page.code,
                            'path': page.path,
                            'description': page.description,
                            'icon': page.icon,
                            'order': page.order,
                            'required_permission': page.required_permission
                        })
                    except ModulePage.DoesNotExist:
                        print(f"❌ Page not found: {page_id}, skipping")
                        continue
                modules_data.append(module_data)
                print(f"✅ Module added: {module.name}")
            print(f"📦 Total modules returned for {org.name}: {len(modules_data)}")
            return Response({
                'success': True,
                'data': modules_data,
                'count': len(modules_data)
            }, status=status.HTTP_200_OK)
        except Exception as e:
            print(f"💥 Error in sub_org_available_modules: {e}")
            return Response({'success': False, 'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def debug_modules_data(request):
    from apps.subscriptions.models import Module, SubscriptionPlan
    
    plans = SubscriptionPlan.objects.all()
    all_modules = Module.objects.all()
    
    result = {
        'plans': [],
        'modules': [],
        'modules_by_plan': {}
    }
    for plan in plans:
        result['plans'].append({
            'id': plan.id,
            'name': plan.name,
            'code': plan.code,
            'is_active': plan.is_active
        })
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
User = get_user_model()

class CreateSubOrgUserView(APIView):
    def post(self, request, org_id):
        try:
            organization = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return Response(
                {"success": False, "error": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = SubOrgUserCreateSerializer(data=request.data, context={'organization': organization})
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {"success": True, "message": "User created successfully", "user_id": user.id},
                status=status.HTTP_201_CREATED
            )
        return Response({"success": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
from apps.organizations.models import UserOrganizationAccess
from apps.subscriptions.models import Module, ModulePage
class UserDashboardView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        try:
            access = UserOrganizationAccess.objects.get(user=user)
        except UserOrganizationAccess.DoesNotExist:
            return Response({
                "success": True,
                "modules": [],
            })
        modules_data = []
        for module_code in access.modules:
            try:
                module = Module.objects.get(code=module_code, is_active=True)
            except Module.DoesNotExist:
                continue
            allowed_page_ids = access.accessible_pages.get(module_code, [])
            pages = []
            if allowed_page_ids:
                module_pages = ModulePage.objects.filter(
                    page_id__in=allowed_page_ids,
                    is_active=True
                )
                for page in module_pages:
                    pages.append({
                        "page_id": str(page.page_id),
                        "name": page.name,
                        "code": page.code,
                        "path": page.path,
                        "description": page.description,
                        "icon": page.icon,
                    })
            modules_data.append({
                "module_id": str(module.module_id),
                "name": module.name,
                "code": module.code,
                "description": module.description,
                "icon": module.icon,
                "pages": pages
            })

        return Response({
            "success": True,
            "modules": modules_data
        })
from django.contrib.auth import authenticate
class SubOrgLoginView(APIView):
    def post(self, request):
        subdomain = request.data.get("subdomain")
        username = request.data.get("username")
        password = request.data.get("password")
        try:
            org = Organization.objects.get(subdomain=subdomain)
        except Organization.DoesNotExist:
            return Response({"success": False, "message": "Invalid Sub-Organization"}, status=400)
        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"success": False, "message": "Invalid username or password"}, status=400)
        if user.organization != org:
            return Response({"success": False, "message": "User not part of this sub-organization"}, status=403)
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)
        return Response({
            "success": True,
            "token": str(refresh.access_token),
            "subdomain": org.subdomain,
        })

from .models import TrainingVideo
from .serializers import TrainingVideoSerializer
from apps.organizations.models import OrganizationUser
class TrainingVideoUploadView(generics.CreateAPIView):
    serializer_class = TrainingVideoSerializer
    permission_classes = [permissions.IsAuthenticated]
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {"success": False, "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        serializer.save(
            organization=request.user.organization,
            uploaded_by=request.user
        )
        return Response(
            {"success": True, "message": "Video uploaded successfully"},
            status=status.HTTP_201_CREATED
        )
class TrainingVideoListView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        try:
            org_user = OrganizationUser.objects.get(user=request.user)
            videos = TrainingVideo.objects.filter(organization=org_user.organization)
        except OrganizationUser.DoesNotExist:
            videos = TrainingVideo.objects.all()  
        serializer = TrainingVideoSerializer(videos, many=True)
        return Response(serializer.data)
    
class TrainingVideoDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):  # pk will be injected via URL
        try:
            org_user = OrganizationUser.objects.get(user=request.user)
            video = get_object_or_404(
                TrainingVideo,
                pk=pk,
                organization=org_user.organization
            )
            video.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except OrganizationUser.DoesNotExist:
            return Response(
                {"error": "You are not associated with any organization"},
                status=status.HTTP_403_FORBIDDEN
            )
        except Exception as e:
            return Response(
                {"error": "Video not found or you don't have permission"},
                status=status.HTTP_404_NOT_FOUND
            )
class MarkVideoWatchedView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, video_id):
        """
        Check if the current employee has watched the given video.
        Returns: {"watched": true/false}
        """
        try:
            video = get_object_or_404(TrainingVideo, id=video_id)
            employee = request.user.employee  # Assuming OneToOne or similar relation

            watched = TrainingVideoView.objects.filter(
                employee=employee,
                video=video
            ).exists()

            return Response({"watched": watched}, status=status.HTTP_200_OK)
        
        except AttributeError:
            # In case request.user has no .employee
            return Response(
                {"error": "User is not linked to an employee"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def post(self, request, video_id):
        """
        Mark the video as watched for the current employee.
        If already watched, it just confirms (idempotent).
        """
        try:
            video = get_object_or_404(TrainingVideo, id=video_id)
            employee = request.user.employee

            # get_or_create ensures it's idempotent — safe to call multiple times
            TrainingVideoView.objects.get_or_create(
                employee=employee,
                video=video,
                defaults={'completed': True}
            )

            # Optionally update completed=True if record existed but was False
            TrainingVideoView.objects.filter(
                employee=employee,
                video=video
            ).update(completed=True)

            return Response({"status": "watched"}, status=status.HTTP_200_OK)

        except AttributeError:
            return Response(
                {"error": "User is not linked to an employee"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except TrainingVideo.DoesNotExist:
            return Response(
                {"error": "Video not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )