# apps/modules/services.py
from .models import Module, ModulePage, OrganizationModule

class ModuleAccessService:

    @staticmethod
    def get_all_modules_with_pages():
        """Return all modules with pages structured for dashboard"""
        modules_data = []
        for module in Module.objects.all():
            pages = [{
                "page_id": page.id,
                "name": page.name,
                "code": page.code,
                "path": page.path,
                "description": page.description,
                "icon": page.icon,
                "order": page.order,
                "required_permission": page.required_permission
            } for page in module.pages.all()]

            modules_data.append({
                "module_id": module.id,
                "name": module.name,
                "code": module.code,
                "description": module.description,
                "icon": module.icon,
                "available_in_plans": module.available_in_plans,
                "pages": pages
            })
        return modules_data

    @staticmethod
    def assign_modules_to_organization(organization, selected_modules):
        """
        selected_modules: [
            {
                "module_id": "<uuid>",
                "is_active": True,
                "accessible_pages": ["page_code1", "page_code2"]
            },
            ...
        ]
        """
        for mod in selected_modules:
            module = Module.objects.get(id=mod["module_id"])
            org_module, created = OrganizationModule.objects.get_or_create(
                organization=organization,
                module=module,
                defaults={
                    "is_active": mod.get("is_active", False),
                    "accessible_pages": mod.get("accessible_pages", [])
                }
            )
            if not created:
                org_module.is_active = mod.get("is_active", org_module.is_active)
                org_module.accessible_pages = mod.get("accessible_pages", org_module.accessible_pages)
                org_module.save()
