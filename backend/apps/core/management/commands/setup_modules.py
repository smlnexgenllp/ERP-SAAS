from django.core.management.base import BaseCommand
from apps.subscriptions.models import Module, ModulePage, SubscriptionPlan, PlanModule

class Command(BaseCommand):
    help = 'Setup default modules and pages in database'
    
    def handle(self, *args, **options):
        self.stdout.write('Setting up default modules...')
        
        # Define modules data
        modules_data = [
            {
                'name': 'HR Management',
                'code': 'hr_management',
                'description': 'Complete human resources management system',
                'icon': 'users',
                'app_name': 'apps.hr_management',
                'base_url': '/hr',
                'available_in_plans': ['basic', 'advance', 'enterprise'],
                'pages': [
                    {'name': 'Dashboard', 'code': 'dashboard', 'path': '/hr/dashboard', 'icon': 'layout-dashboard', 'order': 1},
                    {'name': 'Employees', 'code': 'employees', 'path': '/hr/employees', 'icon': 'users', 'order': 2},
                    {'name': 'Attendance', 'code': 'attendance', 'path': '/hr/attendance', 'icon': 'calendar', 'order': 3},
                    {'name': 'Leave Management', 'code': 'leave', 'path': '/hr/leave', 'icon': 'vacation', 'order': 4},
                    {'name': 'Payroll', 'code': 'payroll', 'path': '/hr/payroll', 'icon': 'dollar-sign', 'order': 5},
                ]
            },
            {
                'name': 'Inventory Management',
                'code': 'inventory', 
                'description': 'Inventory and stock management system',
                'icon': 'package',
                'app_name': 'apps.inventory',
                'base_url': '/inventory',
                'available_in_plans': ['basic', 'advance', 'enterprise'],
                'pages': [
                    {'name': 'Dashboard', 'code': 'dashboard', 'path': '/inventory/dashboard', 'icon': 'layout-dashboard', 'order': 1},
                    {'name': 'Products', 'code': 'products', 'path': '/inventory/products', 'icon': 'package', 'order': 2},
                    {'name': 'Categories', 'code': 'categories', 'path': '/inventory/categories', 'icon': 'folder', 'order': 3},
                    {'name': 'Stock Management', 'code': 'stock', 'path': '/inventory/stock', 'icon': 'warehouse', 'order': 4},
                    {'name': 'Suppliers', 'code': 'suppliers', 'path': '/inventory/suppliers', 'icon': 'truck', 'order': 5},
                ]
            },
            {
                'name': 'Sales Management',
                'code': 'sales',
                'description': 'Sales and customer relationship management',
                'icon': 'shopping-cart', 
                'app_name': 'apps.sales',
                'base_url': '/sales',
                'available_in_plans': ['advance', 'enterprise'],
                'pages': [
                    {'name': 'Dashboard', 'code': 'dashboard', 'path': '/sales/dashboard', 'icon': 'layout-dashboard', 'order': 1},
                    {'name': 'Customers', 'code': 'customers', 'path': '/sales/customers', 'icon': 'users', 'order': 2},
                    {'name': 'Orders', 'code': 'orders', 'path': '/sales/orders', 'icon': 'shopping-cart', 'order': 3},
                    {'name': 'Invoices', 'code': 'invoices', 'path': '/sales/invoices', 'icon': 'file-text', 'order': 4},
                    {'name': 'Reports', 'code': 'reports', 'path': '/sales/reports', 'icon': 'bar-chart', 'order': 5},
                ]
            },
            {
                'name': 'Transport Management',
                'code': 'transport',
                'description': 'Transport and logistics management system',
                'icon': 'truck',
                'app_name': 'apps.transport', 
                'base_url': '/transport',
                'available_in_plans': ['enterprise'],
                'pages': [
                    {'name': 'Dashboard', 'code': 'dashboard', 'path': '/transport/dashboard', 'icon': 'layout-dashboard', 'order': 1},
                    {'name': 'Vehicles', 'code': 'vehicles', 'path': '/transport/vehicles', 'icon': 'truck', 'order': 2},
                    {'name': 'Drivers', 'code': 'drivers', 'path': '/transport/drivers', 'icon': 'user', 'order': 3},
                    {'name': 'Routes', 'code': 'routes', 'path': '/transport/routes', 'icon': 'map', 'order': 4},
                    {'name': 'Shipments', 'code': 'shipments', 'path': '/transport/shipments', 'icon': 'package', 'order': 5},
                ]
            }
        ]
        
        # Create modules and pages
        for module_data in modules_data:
            pages_data = module_data.pop('pages')
            
            module, created = Module.objects.get_or_create(
                code=module_data['code'],
                defaults=module_data
            )
            
            if created:
                self.stdout.write(f"✓ Created module: {module.name}")
            else:
                self.stdout.write(f"↻ Module exists: {module.name}")
            
            # Create pages for this module
            for page_data in pages_data:
                page, page_created = ModulePage.objects.get_or_create(
                    module=module,
                    code=page_data['code'],
                    defaults=page_data
                )
                if page_created:
                    self.stdout.write(f"  ✓ Created page: {page.name}")
        
        # Create subscription plans
        plans_data = [
            {
                'name': 'Basic Plan',
                'code': 'basic',
                'description': 'Essential features for small businesses',
                'monthly_price': 29.00,
                'yearly_price': 299.00,
                'max_users': 10,
                'max_sub_organizations': 0,
                'modules': ['hr_management', 'inventory']
            },
            {
                'name': 'Advance Plan', 
                'code': 'advance',
                'description': 'Advanced features for growing businesses',
                'monthly_price': 79.00,
                'yearly_price': 799.00,
                'max_users': 25,
                'max_sub_organizations': 5,
                'modules': ['hr_management', 'inventory', 'sales']
            },
            {
                'name': 'Enterprise Plan',
                'code': 'enterprise', 
                'description': 'Complete solution for large enterprises',
                'monthly_price': 199.00,
                'yearly_price': 1999.00,
                'max_users': 100,
                'max_sub_organizations': 20,
                'modules': ['hr_management', 'inventory', 'sales', 'transport']
            }
        ]
        
        for plan_data in plans_data:
            modules_list = plan_data.pop('modules')
            
            plan, created = SubscriptionPlan.objects.get_or_create(
                code=plan_data['code'],
                defaults=plan_data
            )
            
            if created:
                self.stdout.write(f"✓ Created plan: {plan.name}")
            else:
                self.stdout.write(f"↻ Plan exists: {plan.name}")
            
            # Assign modules to plan
            for module_code in modules_list:
                try:
                    module = Module.objects.get(code=module_code)
                    PlanModule.objects.get_or_create(
                        plan=plan,
                        module=module,
                        defaults={'is_included': True}
                    )
                    self.stdout.write(f"  ✓ Assigned module: {module.name}")
                except Module.DoesNotExist:
                    self.stdout.write(f"  ✗ Module not found: {module_code}")
        
        self.stdout.write(self.style.SUCCESS('Modules setup completed successfully!'))
