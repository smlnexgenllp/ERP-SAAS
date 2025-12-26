from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Employee


@receiver(post_save, sender=Employee)
def set_employee_code(sender, instance, created, **kwargs):
    if not created:
        return

    org = instance.organization

    # Safety check
    if not org:
        return

    org_code = (org.code or org.name or "ORG").upper()

    instance.employee_code = f"{org_code}-{str(instance.id)[:6]}"
    instance.save(update_fields=["employee_code"])