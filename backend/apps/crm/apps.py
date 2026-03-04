# apps/crm/apps.py
from django.apps import AppConfig


class CrmConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.crm'           # ← must match folder path
    label = 'crm'               # ← short internal label (used in migrations)
    verbose_name = "CRM"        # ← human-readable name in admin

    # def ready(self):
    #     # Optional: import signals here if you have any
    #     import apps.crm.signals     # noqa