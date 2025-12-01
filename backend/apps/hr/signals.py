from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Employee


@receiver(pre_save, sender=Employee)
def set_employee_code(sender, instance, **kwargs):
    """Auto-generate employee_code if not provided: ORGCODE-0001 pattern."""
    if instance.employee_code:
        return
    org = getattr(instance, 'organization', None)
    prefix = 'EMP'
    if org and hasattr(org, 'code'):
        prefix = f"{org.code.upper()}"
# Count existing employees for org (simple increment)
        qs = Employee.objects.filter(organization=org) if org else Employee.objects.all()
        count = qs.count() + 1
        instance.employee_code = f"{prefix}-{count:04d}"