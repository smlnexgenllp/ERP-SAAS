from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import uuid
from apps.subscriptions.models import Module, ModulePage, OrganizationModule, SubscriptionPlan, Subscription

User = get_user_model()

class ModuleAccessService:
    """Service for managing module access for sub-organizations"""
    
    @staticmethod
    def get_all_modules_with_pages():
        """Get all modules with their pages for admin dashboard"""
        modules = Module.objects.filter(is_active=True).prefetch_related('pages')
        
        result = []
        for module in modules:
            module_data = {
                'module_id': str(module.module_id),
                'name': module.name,
                'code': module.code,
                'description': module.description,
                'icon': module.icon,
                'available_in_plans': module.available_in_plans,
                'pages': []
            }
            
            # Get all active pages for this module
            pages = module.pages.filter(is_active=True)
            for page in pages:
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
            
            result.append(module_data)
        
        return result
    
    @staticmethod
    def get_sub_organization_module_access(sub_organization):
        """Get current module access for a sub-organization"""
        org_modules = OrganizationModule.objects.filter(
            organization=sub_organization,
            is_active=True
        ).select_related('module')
        
        result = []
        for org_module in org_modules:
            module_data = {
                'org_module_id': str(org_module.org_module_id),
                'module': {
                    'module_id': str(org_module.module.module_id),
                    'name': org_module.module.name,
                    'code': org_module.module.code,
                    'icon': org_module.module.icon
                },
                'accessible_pages': [],
                'granted_at': org_module.granted_at,
                'granted_by': org_module.granted_by.get_full_name() if org_module.granted_by else 'System'
            }
            
            # Get accessible page details
            accessible_pages = ModulePage.objects.filter(
                page_id__in=org_module.accessible_pages,
                is_active=True
            )
            for page in accessible_pages:
                page_data = {
                    'page_id': str(page.page_id),
                    'name': page.name,
                    'code': page.code,
                    'path': page.path,
                    'icon': page.icon
                }
                module_data['accessible_pages'].append(page_data)
            
            result.append(module_data)
        
        return result
    
    @staticmethod
    @transaction.atomic
    def update_sub_organization_module_access(sub_organization, module_access_data, granted_by):
        """
        Update module access for sub-organization
        
        module_access_data format:
        {
            'module_id': {
                'is_active': True/False,
                'accessible_pages': ['page_id1', 'page_id2', ...]
            }
        }
        """
        for module_id_str, access_data in module_access_data.items():
            try:
                module = Module.objects.get(module_id=module_id_str, is_active=True)
                
                if access_data.get('is_active', False):
                    # Grant or update module access
                    accessible_pages = access_data.get('accessible_pages', [])
                    
                    # Validate that pages belong to this module
                    valid_page_ids = ModulePage.objects.filter(
                        module=module,
                        page_id__in=accessible_pages,
                        is_active=True
                    ).values_list('page_id', flat=True)
                    
                    org_module, created = OrganizationModule.objects.update_or_create(
                        organization=sub_organization,
                        module=module,
                        defaults={
                            'is_active': True,
                            'accessible_pages': [str(pid) for pid in valid_page_ids],
                            'granted_by': granted_by
                        }
                    )
                else:
                    # Revoke module access
                    OrganizationModule.objects.filter(
                        organization=sub_organization,
                        module=module
                    ).update(is_active=False)
                    
            except Module.DoesNotExist:
                continue  # Skip invalid modules
        
        return True
    
    @staticmethod
    def get_available_modules_for_plan(plan_tier):
        """Get modules available for a specific plan tier"""
        return Module.objects.filter(
            is_active=True,
            available_in_plans__contains=[plan_tier]
        ).prefetch_related('pages')
    
    @staticmethod
    def validate_module_access(organization, module_code, page_code=None):
        """Validate if organization has access to module and specific page"""
        try:
            org_module = OrganizationModule.objects.get(
                organization=organization,
                module__code=module_code,
                is_active=True
            )
            
            if not page_code:
                return True
            
            # Check if page is accessible
            page = ModulePage.objects.get(
                module__code=module_code,
                code=page_code,
                is_active=True
            )
            
            return str(page.page_id) in org_module.accessible_pages
            
        except (OrganizationModule.DoesNotExist, ModulePage.DoesNotExist):
            return False

class OrganizationDashboardService:
    """Service for main organization admin dashboard"""
    
    @staticmethod
    def get_main_organization_dashboard_data(main_organization):
        """Get comprehensive data for main org admin dashboard"""
        
        # Get all sub-organizations
        sub_organizations = main_organization.sub_organizations.all().select_related('subscription')
        
        dashboard_data = {
            'main_organization': {
                'id': main_organization.id,
                'name': main_organization.name,
                'plan_tier': main_organization.plan_tier,
                'sub_organizations_count': sub_organizations.count(),
                'total_users': User.objects.filter(organization__in=sub_organizations).count()
            },
            'sub_organizations': [],
            'available_modules': ModuleAccessService.get_all_modules_with_pages()
        }
        
        # Get data for each sub-organization
        for sub_org in sub_organizations:
            sub_org_data = {
                'id': sub_org.id,
                'name': sub_org.name,
                'subdomain': sub_org.subdomain,
                'plan_tier': sub_org.plan_tier,
                'is_active': sub_org.is_active,
                'user_count': sub_org.user_set.count(),
                'module_access': ModuleAccessService.get_sub_organization_module_access(sub_org),
                'created_at': sub_org.created_at,
                'subscription_status': sub_org.subscription.status if hasattr(sub_org, 'subscription') else 'inactive'
            }
            dashboard_data['sub_organizations'].append(sub_org_data)
        
        return dashboard_data
    
    @staticmethod
    def get_sub_organization_detail(main_organization, sub_organization_id):
        """Get detailed information about a specific sub-organization"""
        try:
            sub_org = main_organization.sub_organizations.get(id=sub_organization_id)
            
            detail_data = {
                'sub_organization': {
                    'id': sub_org.id,
                    'name': sub_org.name,
                    'subdomain': sub_org.subdomain,
                    'plan_tier': sub_org.plan_tier,
                    'email': sub_org.email,
                    'phone': sub_org.phone,
                    'address': sub_org.address,
                    'is_active': sub_org.is_active,
                    'created_at': sub_org.created_at,
                    'user_count': sub_org.user_set.count()
                },
                'current_module_access': ModuleAccessService.get_sub_organization_module_access(sub_org),
                'available_modules': ModuleAccessService.get_available_modules_for_plan(sub_org.plan_tier),
                'users': list(sub_org.user_set.values('id', 'username', 'email', 'role', 'is_active'))
            }
            
            return detail_data
            
        except Organization.DoesNotExist:
            return None