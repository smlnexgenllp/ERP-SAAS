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
from apps.organizations.models import Organization, OrganizationUser
from apps.hr.models import Employee
from .services import OrganizationService, ModuleAccessService
from .serializers import SubOrgUserCreateSerializer
from rest_framework.decorators import api_view, permission_classes
from .serializers import ( OrganizationSerializer,  OrganizationRegistrationSerializer, SubOrganizationSerializer, ModuleAccessSerializer,SubOrganizationCreationSerializer)
User = get_user_model()
from .models import Organization
from django.db import IntegrityError
from django.contrib.auth import get_user_model

# In your views.py
class OrganizationRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OrganizationRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        organization_data = {
            "name": serializer.validated_data["name"],
            "subdomain": serializer.validated_data["subdomain"],
            "email": serializer.validated_data["email"],
            "phone": serializer.validated_data.get("phone", ""),
            "address": serializer.validated_data.get("address", ""),
            "plan_tier": serializer.validated_data["plan_tier"],
        }

        admin_user_data = {
            "first_name": serializer.validated_data["admin_first_name"],
            "last_name": serializer.validated_data.get("admin_last_name", ""),
            "email": serializer.validated_data["admin_email"],
            "password": serializer.validated_data["admin_password"],
        }

        try:
            organization, admin_user = OrganizationService.create_main_organization(
                organization_data=organization_data,
                admin_user_data=admin_user_data,
                module_access=None  # or get from request if needed
            )
            return Response({
                "success": True,
                "message": "Organization created successfully!"
            }, status=201)
        except Exception as e:
            return Response({"error": str(e)}, status=400)

class CurrentOrganizationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        organization = get_user_organization(user)
        if not organization:
            return Response({"success": False, "error": "User has no organization"}, status=400)

        org_user = OrganizationUser.objects.filter(
            user=user,
            organization=organization,
            is_active=True
        ).first()

        return Response({
            "success": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
                "is_verified": getattr(user, "is_verified", True)
            },
            "organization": {
                "id": organization.id,
                "name": organization.name,
                "subdomain": organization.subdomain,
                "type": organization.organization_type,
                "plan_tier": organization.plan_tier
            },
            "organization_user": {
                "role": org_user.role if org_user else None
            }
        })
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
            org = request.user.organization

            # 🔥 MAIN ORG → LOAD ALL MODULES
            if org.organization_type == "main":
                modules = Module.objects.filter(is_active=True)

                modules_data = []
                for module in modules:
                    pages = ModulePage.objects.filter(
                        module=module,
                        is_active=True
                    ).order_by("order")

                    modules_data.append({
                        "module_id": str(module.module_id),
                        "name": module.name,
                        "code": module.code,
                        "description": module.description,
                        "icon": module.icon,
                        "available_in_plans": module.available_in_plans,
                        "app_name": module.app_name,
                        "base_url": module.base_url,
                        "is_active": True,
                        "pages": [
                            {
                                "page_id": str(p.page_id),
                                "name": p.name,
                                "code": p.code,
                                "path": p.path,
                                "description": p.description,
                                "icon": p.icon,
                                "order": p.order,
                                "required_permission": p.required_permission
                            }
                            for p in pages
                        ]
                    })
                return Response({
                    "success": True,
                    "data": modules_data,
                    "count": len(modules_data)
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
    permission_classes = [AllowAny]

    def post(self, request, org_id):
        try:
            organization = Organization.objects.get(id=org_id)
        except Organization.DoesNotExist:
            return Response({"success": False, "error": "Organization not found"}, status=404)

        # Ensure only admins of this org can create users
        # try:
        #     org_user = OrganizationUser.objects.get(user=request.user, organization=organization)
        #     if org_user.role != "Admin":
        #         return Response({"success": False, "error": "Permission denied"}, status=403)
        # except OrganizationUser.DoesNotExist:
        #     return Response({"success": False, "error": "Not authorized"}, status=403)

        serializer = SubOrgUserCreateSerializer(
            data=request.data,
            context={'organization': organization}
        )
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                "success": True,
                "message": "User created successfully",
                "user_id": user.id,
                "email": user.email
            }, status=201)
        return Response({"success": False, "errors": serializer.errors}, status=400)
from apps.organizations.models import UserOrganizationAccess
from apps.subscriptions.models import Module, ModulePage
# In your views.py
from apps.organizations.models import UserOrganizationAccess, OrganizationUser
from apps.subscriptions.models import Module, ModulePage, OrganizationModule

class UserDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Find user's organization via OrganizationUser
        try:
            org_user = OrganizationUser.objects.get(user=user, is_active=True)
            organization = org_user.organization
        except OrganizationUser.DoesNotExist:
            return Response({
                "success": False,
                "error": "User not linked to any organization"
            }, status=400)

        # Priority 1: Per-user module access (most restrictive)
        try:
            user_access = UserOrganizationAccess.objects.get(user=user, organization=organization)
            allowed_module_codes = user_access.modules
            print(f"Per-user access: {allowed_module_codes}")
        except UserOrganizationAccess.DoesNotExist:
            allowed_module_codes = []

        # Priority 2: If no per-user access, fallback to organization-wide modules (for admins)
        if not allowed_module_codes and org_user.role == "Admin":
            org_modules = OrganizationModule.objects.filter(
                organization=organization,
                is_active=True
            ).select_related('module')
            allowed_module_codes = [om.module.code for om in org_modules]

        # If still empty and not admin → no access
        if not allowed_module_codes:
            return Response({
                "success": True,
                "modules": []
            })

        # Build response
        modules_data = []
        for module_code in allowed_module_codes:
            try:
                module = Module.objects.get(code=module_code, is_active=True)
            except Module.DoesNotExist:
                continue

            # Get pages: use org-level accessible_pages if admin, else default all (or restrict later)
            pages = []
            if org_user.role == "Admin":
                try:
                    org_module = OrganizationModule.objects.get(
                        organization=organization,
                        module=module,
                        is_active=True
                    )
                    page_ids = org_module.accessible_pages
                    module_pages = ModulePage.objects.filter(page_id__in=page_ids, is_active=True)
                    for page in module_pages:
                        pages.append({
                            "page_id": str(page.page_id),
                            "name": page.name,
                            "code": page.code,
                            "path": page.path,
                            "description": page.description,
                            "icon": page.icon,
                        })
                except OrganizationModule.DoesNotExist:
                    pass
            else:
                # For regular users: show all pages of allowed modules (or restrict further later)
                module_pages = module.pages.filter(is_active=True)
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
            "modules": modules_data,
            "count": len(modules_data)
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

from rest_framework.views import APIView
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404
from django.utils import timezone

from apps.organizations.models import TrainingVideo, TrainingVideoView
from apps.organizations.serializers import TrainingVideoSerializer
from apps.organizations.models import Organization, OrganizationUser, TrainingCompletion
from apps.hr.models import Employee
from apps.accounts.models import User  # Adjust if your User model is elsewhere


def get_user_organization(user):
    """
    Returns the organization linked to the user.
    Priority:
    1. Employee organization
    2. Organization creator (main admin)
    3. OrganizationUser mapping
    """

    # 1️⃣ Employee-based organization
    try:
        if hasattr(user, "employee") and user.employee.organization:
            return user.employee.organization
    except Employee.DoesNotExist:
        pass

    # 2️⃣ Organization creator (main admin)
    org = Organization.objects.filter(created_by=user).first()
    if org:
        return org

    # 3️⃣ OrganizationUser mapping (optional / legacy)
    try:
        return OrganizationUser.objects.get(user=user).organization
    except OrganizationUser.DoesNotExist:
        pass

    return None




class TrainingVideoUploadView(CreateAPIView):
    serializer_class = TrainingVideoSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        organization = get_user_organization(self.request.user)
        if not organization:
            raise permissions.exceptions.PermissionDenied("You are not associated with any organization.")

        serializer.save(
            organization=organization,
            uploaded_by=self.request.user
        )


class TrainingVideoListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        organization = get_user_organization(request.user)
        if not organization:
            return Response(
                {"error": "You are not associated with any organization."},
                status=status.HTTP_403_FORBIDDEN
            )
        videos = TrainingVideo.objects.filter(organization=organization).order_by('-created_at')
        
        serializer = TrainingVideoSerializer(videos, many=True)  # ← Remove context here
        return Response(serializer.data)


class TrainingVideoDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        organization = get_user_organization(request.user)
        if not organization:
            return Response(
                {"error": "You are not associated with any organization"},
                status=status.HTTP_403_FORBIDDEN
            )

        video = get_object_or_404(
            TrainingVideo,
            pk=pk,
            organization=organization
        )

        # Optional: Only allow uploaders or admins to delete
        # if video.uploaded_by != request.user and request.user.role not in admin_roles:
        #     return Response({"error": "Permission denied"}, status=403)

        video.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import TrainingCompletion

class TrainingCompletedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        organization = get_user_organization(request.user)
        if not organization:
            return Response(
                {"error": "Organization not found for this user"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # This will create or update the record
        completion, created = TrainingCompletion.objects.update_or_create(
            user=request.user,
            organization=organization,
            defaults={
                'completed': True,
                'completed_at': timezone.now(),  # Now this WILL update every time!
            }
        )

        return Response({
            "message": "Training marked as completed successfully",
            "employee": request.user.get_full_name() or request.user.email,
            "completed": True,
            "completed_at": completion.completed_at.isoformat(),
        }, status=status.HTTP_200_OK)


class TrainingCompletedStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization = get_user_organization(request.user)
        if not organization:
            return Response(
                {"detail": "User is not associated with any organization."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Admins see all, regular users see only themselves
        admin_roles = [User.SUB_ORG_ADMIN, User.MAIN_ORG_ADMIN, User.SUPER_ADMIN]
        is_admin = getattr(request.user, 'role', None) in admin_roles or request.user.is_staff

        if is_admin:
            completions = TrainingCompletion.objects.filter(organization=organization).select_related("user")
        else:
            completions = TrainingCompletion.objects.filter(
                organization=organization,
                user=request.user
            ).select_related("user")

        data = []
        for tc in completions:
            data.append({
                "employee_id": tc.user.id,
                "employee_name": tc.user.get_full_name().strip() or tc.user.email,
                "employee_email": tc.user.email,
                "completed": tc.completed,                    # Uses the BooleanField
                "completed_at": tc.completed_at.isoformat() if tc.completed_at else None,
            })
        return Response(data)
class TrainingProgressView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization = get_user_organization(request.user)
        if not organization:
            return Response(
                {"detail": "Organization not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Restrict to admins only (or adjust as needed)
        admin_roles = [User.SUB_ORG_ADMIN, User.MAIN_ORG_ADMIN, User.SUPER_ADMIN]
        if getattr(request.user, 'role', None) not in admin_roles and not request.user.is_staff:
            return Response(
                {"detail": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN
            )

        total_videos = TrainingVideo.objects.filter(organization=organization).count()
        if total_videos == 0:
            return Response([])

        # Get all users (employees) in this organization
        employees = User.objects.filter(
            employee__organization=organization
        ).distinct().select_related('employee')

        # Get set of users who completed training
        completed_user_ids = set(
            TrainingCompletion.objects.filter(
                organization=organization
            ).values_list('user_id', flat=True)
        )

        response = []
        for emp in employees:
            is_completed = emp.id in completed_user_ids
            completed_count = total_videos if is_completed else 0
            percentage = 100 if is_completed else 0

            response.append({
                "employee_id": emp.id,
                "employee_email": emp.email,
                "employee_name": emp.get_full_name().strip() or emp.email,
                "completed_count": completed_count,
                "total_videos": total_videos,
                "percentage": percentage,
                "is_completed": is_completed
            })

        return Response(response)
    
# views.py
class MarkVideoWatchedView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        video_id = request.data.get("video_id")
        if not video_id:
            return Response({"error": "video_id required"}, status=400)

        organization = get_user_organization(request.user)
        if not organization:
            return Response({"error": "No organization"}, status=400)

        try:
            video = TrainingVideo.objects.get(id=video_id, organization=organization)
        except TrainingVideo.DoesNotExist:
            return Response({"error": "Video not found"}, status=404)

        view_record, created = TrainingVideoView.objects.update_or_create(
            user=request.user,
            video=video,
            defaults={
                'organization': organization,
                'completed': True,
                'progress': 100,  # or calculate based on time if you track duration
                'watched_at': timezone.now(),
            }
        )

        return Response({
            "message": "Video marked as completed",
            "video_id": video.id,
            "completed": True
        })
# apps/organizations/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.organizations.models import UserOrganizationAccess

class SubOrgUserModulesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Fetch modules for this user's organization
        org_access = UserOrganizationAccess.objects.filter(user=user).first()
        modules = org_access.modules if org_access else []
        return Response({"modules": modules})
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.organizations.models import OrganizationUser

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.organizations.models import OrganizationUser

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        org_user = OrganizationUser.objects.filter(
            user=user,
            is_active=True
        ).select_related("organization").first()

        return Response({
            "success": True,
            "user": {
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role,
            },
            "organization": {
                "id": org_user.organization.id if org_user else None,
                "name": org_user.organization.name if org_user else None,
                "type": org_user.organization.organization_type if org_user else None,
            },
            "organization_user": {   # ✅ FIXED KEY
                "role": org_user.role if org_user else None
            }
        })

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.organizations.models import OrganizationUser

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_suborg_user_role(request):
    """
    Return the role of the logged-in user for their organization
    """
    try:
        org_user = OrganizationUser.objects.filter(user=request.user).first()
        if not org_user:
            return Response({"role": None, "message": "User is not linked to any organization."})
        return Response({"role": org_user.role})
    except Exception as e:
        return Response({"role": None, "error": str(e)}, status=500)
