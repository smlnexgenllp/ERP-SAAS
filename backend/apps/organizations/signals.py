from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Organization
from .models import OrganizationFeature


@receiver(post_save, sender=Organization)
def create_organization_features(
    sender,
    instance,
    created,
    **kwargs
):
    if created:
        OrganizationFeature.objects.get_or_create(
            organization=instance
        )
        