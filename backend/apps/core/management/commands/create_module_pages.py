# from django.core.management.base import BaseCommand
# from apps.subscriptions.models import Module, ModulePage

# class Command(BaseCommand):
#     help = 'Create default pages for modules'
    
#     def handle(self, *args, **options):
#         self.stdout.write('Creating default module pages...')
        
#         module_pages = {
#             'hr_management': [
#                 {'name': 'Dashboard', 'code': 'dashboard', 'path': '/hr/dashboard', 'icon': 'layout-dashboard', 'order': 1},
#                 {'name': 'Employees', 'code': 'employees', 'path': '/hr/employees', 'icon': 'users', 'order': 2},
#                 {'name': 'Attendance', 'code': 'attendance', 'path': '/hr/attendance', 'icon': 'calendar', 'order': 3},
#                 {'name': 'Leave Management', 'code': 'leave', 'path': '/hr/leave', 'icon': 'vacation', 'order': 4},
#                 {'name': 'Payroll', 'code': 'payroll', 'path': '/hr/payroll', 'icon': 'dollar-sign', 'order': 5},
#                 {'name': 'Departments', 'code': 'departments', 'path': '/hr/departments', 'icon': 'building', 'order': 6},
#             ],
#             'inventory': [
#                 {'name': 'Dashboard', 'code': 'dashboard', 'path': '/inventory/dashboard', 'icon': 'layout-dashboard', 'order': 1},
#                 {'name': 'Products', 'code': 'products', 'path': '/inventory/products', 'icon': 'package', 'order': 2},
#                 {'name': 'Categories', 'code': 'categories', 'path': '/inventory/categories', 'icon': 'folder', 'order': 3},
#                 {'name': 'Stock Management', 'code': 'stock', 'path': '/inventory/stock', 'icon': 'warehouse', 'order': 4},
#                 {'name': 'Suppliers', 'code': 'suppliers', 'path': '/inventory/suppliers', 'icon': 'truck', 'order': 5},
#                 {'name': 'Reports', 'code': 'reports', 'path': '/inventory/reports', 'icon': 'bar-chart', 'order': 6},
#             ],
#             'sales': [
#                 {'name': 'Dashboard', 'code': 'dashboard', 'path': '/sales/dashboard', 'icon': 'layout-dashboard', 'order': 1},
#                 {'name': 'Customers', 'code': 'customers', 'path': '/sales/customers', 'icon': 'users', 'order': 2},
#                 {'name': 'Orders', 'code': 'orders', 'path': '/sales/orders', 'icon': 'shopping-cart', 'order': 3},
#                 {'name': 'Invoices', 'code': 'invoices', 'path': '/sales/invoices', 'icon': 'file-text', 'order': 4},
#                 {'name': 'Quotations', 'code': 'quotations', 'path': '/sales/quotations', 'icon': 'quote', 'order': 5},
#                 {'name': 'Reports', 'code': 'reports', 'path': '/sales/reports', 'icon': 'bar-chart', 'order': 6},
#             ],
#             'transport': [
#                 {'name': 'Dashboard', 'code': 'dashboard', 'path': '/transport/dashboard', 'icon': 'layout-dashboard', 'order': 1},
#                 {'name': 'Vehicles', 'code': 'vehicles', 'path': '/transport/vehicles', 'icon': 'truck', 'order': 2},
#                 {'name': 'Drivers', 'code': 'drivers', 'path': '/transport/drivers', 'icon': 'user', 'order': 3},
#                 {'name': 'Routes', 'code': 'routes', 'path': '/transport/routes', 'icon': 'map', 'order': 4},
#                 {'name': 'Shipments', 'code': 'shipments', 'path': '/transport/shipments', 'icon': 'package', 'order': 5},
#                 {'name': 'Reports', 'code': 'reports', 'path': '/transport/reports', 'icon': 'bar-chart', 'order': 6},
#             ]
#         }
        
#         for module_code, pages_data in module_pages.items():
#             try:
#                 module = Module.objects.get(code=module_code)
                
#                 for page_data in pages_data:
#                     ModulePage.objects.get_or_create(
#                         module=module,
#                         code=page_data['code'],
#                         defaults=page_data
#                     )
#                     self.stdout.write(f"Created page: {module.name} - {page_data['name']}")
                    
#             except Module.DoesNotExist:
#                 self.stdout.write(f"Module not found: {module_code}")
        
#         self.stdout.write(self.style.SUCCESS('Module pages created successfully!'))