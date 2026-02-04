from django.core.management.base import BaseCommand
from apps.subscriptions.models import Module, ModulePage

class Command(BaseCommand):
    help = 'Setup module definitions for Django apps'

    def handle(self, *args, **options):
        django_apps_as_modules = [
            {
                'name': 'HR Management',
                'code': 'hr_management',
                'description': 'Human Resources management system',
                'icon': 'users',
                'available_in_plans': ['basic', 'advance', 'enterprise'],
                'app_name': 'hr_management',
                'base_url': '/hr/',
                'is_active': True
            },
            {
                'name': 'Inventory Management', 
                'code': 'inventory',
                'description': 'Inventory and stock management system',
                'icon': 'package',
                'available_in_plans': ['advance', 'enterprise'],
                'app_name': 'inventory',
                'base_url': '/inventory/',
                'is_active': True
            },
            {
                'name': 'Sales Management',
                'code': 'sales', 
                'description': 'Sales and order management system',
                'icon': 'shopping-cart',
                'available_in_plans': ['advance', 'enterprise'],
                'app_name': 'sales',
                'base_url': '/sales/',
                'is_active': True
            },
            {
                'name': 'Transport Management',
                'code': 'transport',
                'description': 'Transport and logistics management',
                'icon': 'truck',
                'available_in_plans': ['enterprise'],
                'app_name': 'transport', 
                'base_url': '/transport/',
                'is_active': True
            },
            {
                'name': 'Finance Management',
                'code': 'finance',
                'description': 'Finance, accounting, billing and expense management',
                'icon': 'dollar-sign',
                'available_in_plans': ['basic', 'advance', 'enterprise'],
                'app_name': 'finance',
                'base_url': '/accounting/',
                'is_active': True
            }
        ]

        self.stdout.write("🔄 Creating/updating module definitions for your Django apps...")

        for module_data in django_apps_as_modules:
            module, created = Module.objects.get_or_create(
                code=module_data['code'],
                defaults=module_data
            )
            
            if created:
                self.stdout.write(self.style.SUCCESS(f"✅ CREATED: {module.name}"))
                
                pages_data = [
                    {
                        'name': 'Dashboard',
                        'code': 'dashboard',
                        'path': f"{module.base_url}dashboard/",
                        'description': f'{module.name} Dashboard',
                        'icon': 'layout-dashboard',
                        'order': 1,
                        'required_permission': 'view',
                        'is_active': True
                    },
                    {
                        'name': 'Settings',
                        'code': 'settings', 
                        'path': f"{module.base_url}settings/",
                        'description': f'{module.name} Settings',
                        'icon': 'settings',
                        'order': 99,
                        'required_permission': 'admin',
                        'is_active': True
                    }
                ]
                
                for page_data in pages_data:
                    ModulePage.objects.create(module=module, **page_data)
                    self.stdout.write(f"   📄 Created page: {page_data['name']}")
            else:
                for key, value in module_data.items():
                    setattr(module, key, value)
                module.save()
                self.stdout.write(f"📝 UPDATED: {module.name}")

        self.stdout.write(self.style.SUCCESS("🎉 Module definitions updated!"))