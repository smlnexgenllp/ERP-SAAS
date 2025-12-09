from django.db import transaction
from django.contrib.auth import get_user_model
from apps.subscriptions.models import Module
from apps.organizations.models import UserModule

User = get_user_model()
class UserModuleAccessService:
    @staticmethod
    @transaction.atomic
    def assign_modules_to_user(user, module_codes, accessible_pages_map=None, granted_by=None):
        if accessible_pages_map is None:
             accessible_pages_map = {}
        for code in module_codes:
            try:
                module = Module.objects.get(code=code, is_active=True)
            except Module.DoesNotExist:
        continue
    pages = accessible_pages_map.get(code, [])
    um, created = UserModule.objects.update_or_create(
    user=user,
    module=module,
    defaults={
        'is_active': True,
        'accessible_pages': [str(p) for p in pages],
        'granted_by': granted_by
    }
)
    @staticmethod
    def get_user_modules(user):
    result = []
    for um in user.user_modules.filter(is_active=True).select_related('module'):
        result.append({
            'code': um.module.code,
            'name': um.module.name,
            'pages': um.accessible_pages
    })
return result