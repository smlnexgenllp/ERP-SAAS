# from django.core.management.base import BaseCommand
# from apps.subscriptions.models import SubscriptionPlan, Module, ModulePage

# class Command(BaseCommand):
#     help = 'Seed initial modules and plans data'

#     def handle(self, *args, **options):
#         self.stdout.write('Seeding initial data...')

#         # Create subscription plans
#         plans_data = [
#             {'name': 'Basic', 'code': 'basic', 'price': 99},
#             {'name': 'Advance', 'code': 'advance', 'price': 199},
#             {'name': 'Enterprise', 'code': 'enterprise', 'price': 299},
#         ]

#         for plan_data in plans_data:
#             plan, created = SubscriptionPlan.objects.get_or_create(
#                 code=plan_data['code'],
#                 defaults=plan_data
#             )
#             if created:
#                 self.stdout.write(self.style.SUCCESS(f'Created plan: {plan.name}'))
#             else:
#                 self.stdout.write(f'Plan already exists: {plan.name}')

#         # Create modules
#         modules_data = [
#             {
#                 'name': 'HR Management',
#                 'code': 'hr_management',
#                 'description': 'Human Resources management system',
#                 'icon': 'users',
#                 'available_in_plans': ['basic', 'advance', 'enterprise'],
#                 'app_name': 'hr',
#                 'base_url': '/hr/',
#                 'is_active': True
#             },
#             {
#                 'name': 'Inventory Management',
#                 'code': 'inventory_management',
#                 'description': 'Inventory and stock management system',
#                 'icon': 'package',
#                 'available_in_plans': ['advance', 'enterprise'],
#                 'app_name': 'inventory',
#                 'base_url': '/inventory/',
#                 'is_active': True
#             },
#             {
#                 'name': 'Accounting',
#                 'code': 'accounting',
#                 'description': 'Financial accounting and bookkeeping',
#                 'icon': 'calculator',
#                 'available_in_plans': ['enterprise'],
#                 'app_name': 'accounting',
#                 'base_url': '/accounting/',
#                 'is_active': True
#             },
#             {
#                 'name': 'CRM',
#                 'code': 'crm',
#                 'description': 'Customer Relationship Management',
#                 'icon': 'contact',
#                 'available_in_plans': ['advance', 'enterprise'],
#                 'app_name': 'crm',
#                 'base_url': '/crm/',
#                 'is_active': True
#             },
#             {
#                 'name': 'Project Management',
#                 'code': 'project_management',
#                 'description': 'Project planning and tracking',
#                 'icon': 'clipboard-list',
#                 'available_in_plans': ['enterprise'],
#                 'app_name': 'projects',
#                 'base_url': '/projects/',
#                 'is_active': True
#             },
#         ]

#         for module_data in modules_data:
#             module, created = Module.objects.get_or_create(
#                 code=module_data['code'],
#                 defaults=module_data
#             )
#             if created:
#                 self.stdout.write(self.style.SUCCESS(f'Created module: {module.name}'))
                
#                 # Create default pages
#                 pages_data = [
#                     {
#                         'name': 'Dashboard',
#                         'code': 'dashboard',
#                         'path': f'{module.base_url}dashboard/',
#                         'description': f'{module.name} Dashboard',
#                         'icon': 'layout-dashboard',
#                         'order': 1,
#                         'required_permission': 'view',
#                         'is_active': True
#                     },
#                     {
#                         'name': 'Settings',
#                         'code': 'settings',
#                         'path': f'{module.base_url}settings/',
#                         'description': f'{module.name} Settings',
#                         'icon': 'settings',
#                         'order': 99,
#                         'required_permission': 'admin',
#                         'is_active': True
#                     },
#                 ]
                
#                 for page_data in pages_data:
#                     ModulePage.objects.create(module=module, **page_data)
#                     self.stdout.write(f'  - Created page: {page_data["name"]}')
#             else:
#                 self.stdout.write(f'Module already exists: {module.name}')

#         self.stdout.write(self.style.SUCCESS('Successfully seeded initial data!'))