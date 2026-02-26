from django.apps import AppConfig

class CrmConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.crm'          # or just 'crm' — match your import style
    label = 'crm'              # used in migrations / settings
    verbose_name = "CRM"