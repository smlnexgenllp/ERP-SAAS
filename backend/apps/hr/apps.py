from django.apps import AppConfig
from django.db.models.signals import post_save
from django.dispatch import receiver



class HrConfig(AppConfig):

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hr'
    label='apps_hr'
    verbose_name = 'Human Resources'


    def ready(self):
# import signals to register them
        from . import signals # noqa

@receiver(post_save, sender='organizations.Organization')  # String reference – SAFE
def create_organization_chat_group(sender, instance, created, **kwargs):
    if created:
        from apps.hr.models import ChatGroup  # Import inside to avoid circular imports

        ChatGroup.objects.get_or_create(
            group_type=ChatGroup.GROUP_TYPE_ORG,
            organization=instance,
            defaults={'name': f"{instance.name} - General Chat"}
        )


@receiver(post_save, sender='apps_hr.Project')  # ← Matches your app label
def create_project_chat_group(sender, instance, created, **kwargs):
    if created:
        from apps.hr.models import ChatGroup
        ChatGroup.objects.get_or_create(
            group_type=ChatGroup.GROUP_TYPE_PROJECT,
            organization=instance.organization,
            project=instance,
            defaults={'name': f"Project: {instance.name} Chat"}
        )