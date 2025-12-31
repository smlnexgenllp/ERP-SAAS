from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.hr.models import Employee ,Project,ChatGroup
from apps.organizations.models import Organization
from django.db.models.signals import m2m_changed

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

# hr/signals.py
@receiver(post_save, sender=Organization)
def create_organization_chat_group(sender, instance, created, **kwargs):
    if created:
        from apps.hr.models import ChatGroup

        ChatGroup.objects.get_or_create(
            group_type=ChatGroup.GROUP_TYPE_ORG,
            organization=instance,
            defaults={'name': f"{instance.name} - General Chat"}
        )


@receiver(post_save, sender=Project)
def create_project_chat_group(sender, instance, created, **kwargs):
    """
    Automatically create a chat group when a new project is created.
    """
    if created:
        # Create the project chat group
        ChatGroup.objects.create(
            name=f"Project: {instance.name}",
            group_type=ChatGroup.GROUP_TYPE_PROJECT,
            organization=instance.organization,
            project=instance
        )

@receiver(post_save, sender=Project)
def ensure_project_chat_group(sender, instance, created, **kwargs):
    """
    Permanently ensures every project has a chat group.
    Runs on every project save — creates if missing, updates name if changed.
    """
    # Always try to get or create the chat group
    chat_group, created = ChatGroup.objects.get_or_create(
        group_type='project',
        organization=instance.organization,
        project=instance,
        defaults={'name': f"Project: {instance.name}"}
    )
    
    # If exists but name changed, update it
    if not created and chat_group.name != f"Project: {instance.name}":
        chat_group.name = f"Project: {instance.name}"
        chat_group.save(update_fields=['name'])
    
    # Optional: log for debugging
    # print(f"[Chat Auto] {'Created' if created else 'Ensured'} chat for project: {instance.name}")  


@receiver(m2m_changed, sender=Project.members.through)
def update_project_chat_members(sender, instance, action, pk_set, **kwargs):
    """
    When employees are added/removed from a project,
    update the corresponding chat group members.
    """
    if action in ["post_add", "post_remove"]:
        # Find the project's chat group
        chat_group = ChatGroup.objects.filter(
            project=instance,
            group_type=ChatGroup.GROUP_TYPE_PROJECT
        ).first()
        
        if chat_group:
            # Get all project members' users
            employee_ids = instance.members.values_list('id', flat=True)
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            user_ids = User.objects.filter(
                employee__id__in=employee_ids
            ).values_list('id', flat=True)
            
            # Update chat group manual members
            chat_group.manual_members.set(user_ids)
            print(f"Updated chat group {chat_group.id} members to {len(user_ids)} users")          