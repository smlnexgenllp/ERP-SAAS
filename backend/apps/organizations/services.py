# In apps/organizations/services.py
from django.db import transaction
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
# Removed redundant imports inside methods by adding global imports (recommended)
from apps.subscriptions.models import Module, OrganizationModule, ModulePage, SubscriptionPlan, Subscription 
from apps.organizations.models import Organization # Assuming this exists

User = get_user_model()

class ModuleAccessService:
    """Service for managing module access"""
    
    @staticmethod
    def get_all_modules_with_pages():
        """Get all modules with their pages for admin dashboard"""
        # Removed inner import
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
                'app_name': module.app_name, # Added based on usage
                'base_url': module.base_url, # Added based on usage
                'pages': []
            }
            # ... page loading logic ...
            pages = module.pages.filter(is_active=True)
            for page in pages:
                # ... page data mapping ...
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
    def get_modules_for_plan(plan_tier):
        """Get modules available for a specific plan tier"""
        # Import inside method to avoid circular imports
        from apps.subscriptions.models import Module
        
        # Convert plan_tier to lowercase for case-insensitive matching
        plan_tier_lower = plan_tier.lower()
        
        modules = Module.objects.filter(
            is_active=True
        ).prefetch_related('pages')
        
        result = []
        for module in modules:
            # Check if module is available for the specified plan
            if module.available_in_plans and plan_tier_lower in [p.lower() for p in module.available_in_plans]:
                module_data = {
                    'module_id': str(module.module_id),
                    'name': module.name,
                    'code': module.code,
                    'description': module.description,
                    'icon': module.icon,
                    'available_in_plans': module.available_in_plans,
                    'app_name': module.app_name,
                    'base_url': module.base_url,
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
    def get_organization_modules(organization):
        """Get all modules assigned to an organization"""
        # Removed inner import
        return OrganizationModule.objects.filter(
            organization=organization,
            is_active=True
        ).select_related('module')
    
    @staticmethod
    @transaction.atomic
    def assign_modules_to_organization(organization, module_codes, accessible_pages_map=None, granted_by=None):
        """Assign modules to organization with page-level access"""
        # Removed inner import
        
        if accessible_pages_map is None:
            accessible_pages_map = {}
        
        for module_code in module_codes:
            try:
                module = Module.objects.get(code=module_code, is_active=True)
                
                # Get all page IDs for this module by default
                # Assuming page_id is a UUID or something that needs str() conversion
                all_page_ids = list(module.pages.filter(is_active=True).values_list('page_id', flat=True))
                
                # Use provided accessible pages (if provided) or all pages
                accessible_pages = accessible_pages_map.get(module_code, all_page_ids)
                
                # Ensure all elements in the list are strings for JSONField consistency
                string_accessible_pages = [str(pid) for pid in accessible_pages]
                
                # Create or update organization module assignment
                org_module, created = OrganizationModule.objects.get_or_create(
                    organization=organization,
                    module=module,
                    defaults={
                        'is_active': True,
                        'accessible_pages': string_accessible_pages,
                        'granted_by': granted_by
                    }
                )
                
                if not created:
                    org_module.is_active = True
                    org_module.accessible_pages = string_accessible_pages
                    org_module.granted_by = granted_by
                    org_module.save()
                    
            except Module.DoesNotExist:
                continue  # Skip invalid modules
    
    @staticmethod
    def can_access_module(user, module_code):
        # Removed inner import
        if user.role == User.SUPER_ADMIN:
            return True
        
        return OrganizationModule.objects.filter(
            organization=user.organization,
            module__code=module_code,
            is_active=True
        ).exists()
    
    @staticmethod
    def can_access_page(user, module_code, page_code):
        # Removed inner import
        if user.role == User.SUPER_ADMIN:
            return True
        
        try:
            org_module = OrganizationModule.objects.get(
                organization=user.organization,
                module__code=module_code,
                is_active=True
            )
            
            # Get the page
            page = ModulePage.objects.get(
                module__code=module_code,
                code=page_code,
                is_active=True
            )
            
            # Check if page is in accessible pages
            return str(page.page_id) in org_module.accessible_pages
            
        except (OrganizationModule.DoesNotExist, ModulePage.DoesNotExist):
            return False

class OrganizationService:
    """Service for organization management"""

    # ... your existing create_main_organization method ...

    @staticmethod
    @transaction.atomic
    def create_sub_organization(main_organization, organization_data, admin_user_data, module_access=None):
        """
        Create a sub-organization with admin user and module access
        """
        try:
            # Import inside method to avoid circular imports
            from apps.organizations.models import Organization
            from apps.subscriptions.models import SubscriptionPlan, Subscription, Module, OrganizationModule
            
            print(f"🔧 Creating sub-organization: {organization_data['name']}")
            print(f"🔧 Module access data received: {module_access}")  # Debug
            
            # Check if user already exists
            if User.objects.filter(email=admin_user_data['email']).exists():
                raise Exception("Admin user with this email already exists")

            # Create the admin user
            admin_user = User.objects.create_user(
                username=admin_user_data['email'],
                email=admin_user_data['email'],
                password=admin_user_data['password'],
                first_name=admin_user_data['first_name'],
                last_name=admin_user_data.get('last_name', ''),
                role=User.SUB_ORG_ADMIN,
                is_verified=True,
                is_active=True
            )

            # Create sub-organization
            sub_organization = Organization.objects.create(
                name=organization_data['name'],
                subdomain=organization_data['subdomain'],
                organization_type='sub',
                plan_tier=organization_data.get('plan_tier', 'basic'),
                email=organization_data['email'],
                phone=organization_data.get('phone', ''),
                address=organization_data.get('address', ''),
                parent_organization=main_organization,
                created_by=admin_user,
                is_active=True
            )

            # Link user to organization
            admin_user.organization = sub_organization
            admin_user.save()

            # Create subscription
            try:
                plan = SubscriptionPlan.objects.get(code__iexact=sub_organization.plan_tier)
            except SubscriptionPlan.DoesNotExist:
                plan = SubscriptionPlan.objects.filter(is_active=True).first()

            Subscription.objects.create(
                organization=sub_organization,
                plan=plan,
                start_date=timezone.now(),
                end_date=timezone.now() + timedelta(days=365),
                status='active',
                is_trial=False
            )

            # Assign selected modules if provided
            if module_access:
                print(f"🔧 Processing {len(module_access)} modules for assignment")  # Debug
                for module_code in module_access:
                    try:
                        module = Module.objects.get(code=module_code, is_active=True)
                        page_ids = list(module.pages.filter(is_active=True).values_list('page_id', flat=True))
                        
                        # Create organization module assignment
                        org_module = OrganizationModule.objects.create(
                            organization=sub_organization,
                            module=module,
                            is_active=True,
                            accessible_pages=[str(pid) for pid in page_ids],
                            granted_by=main_organization.created_by
                        )
                        print(f"✅ Assigned module: {module.name}")
                        
                    except Module.DoesNotExist:
                        print(f"❌ Module not found: {module_code}")
                        continue
            else:
                print("ℹ️ No module access provided during sub-organization creation")

            print(f"🎉 Sub-organization created successfully: {sub_organization.name}")
            return sub_organization, admin_user

        except Exception as e:
            # Rollback transaction on any error
            raise Exception(f"Failed to create sub-organization: {str(e)}")
