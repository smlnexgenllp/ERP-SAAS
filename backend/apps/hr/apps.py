from django.apps import AppConfig




class HrConfig(AppConfig):

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hr'
    label='apps_hr'
    verbose_name = 'Human Resources'


    def ready(self):
# import signals to register them
        from . import signals # noqa