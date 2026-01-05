# apps/hr/signals.py

from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver
from apps.hr.models import Employee, Project, ChatGroup
from apps.organizations.models import Organization
from django.contrib.auth import get_user_model

User = get_user_model()


# ================= EMPLOYEE CODE =================
@receiver(post_save, sender=Employee)
def set_employee_code(sender, instance, created, **kwargs):
    if not created:
        return

    org = instance.organization
    if not org:
        return

    org_code = (org.code or org.name or "ORG").upper()[:10]  # Safety limit
    instance.employee_code = f"{org_code}-{str(instance.id).zfill(6)}"
    instance.save(update_fields=["employee_code"])


# ================= ORGANIZATION CHAT GROUP =================
@receiver(post_save, sender=Organization)
def create_organization_chat_group(sender, instance, created, **kwargs):
    if not created:
        return

    ChatGroup.objects.get_or_create(
        group_type=ChatGroup.GROUP_TYPE_ORG,
        organization=instance,
        defaults={'name': f"{instance.name} - General Chat"}
    )


# ================= PROJECT CHAT GROUP (SAFE & SYNCED) =================
@receiver(post_save, sender=Project)
def manage_project_chat_group(sender, instance, created, **kwargs):
    """
    Ensures every Project has exactly one chat group.
    - Creates it when project is first created
    - Updates group name if project name changes
    - Uses get_or_create → never violates unique constraint
    """
    if not instance.organization:
        return

    chat_group, group_created = ChatGroup.objects.get_or_create(
        organization=instance.organization,
        project=instance,
        group_type=ChatGroup.GROUP_TYPE_PROJECT,
        defaults={
            'name': f"Project: {instance.name}",
        }
    )

    # Sync name if project was renamed
    if not group_created:
        expected_name = f"Project: {instance.name}"
        if chat_group.name != expected_name:
            chat_group.name = expected_name
            chat_group.save(update_fields=['name'])


# ================= PROJECT MEMBERS → CHAT MEMBERS SYNC =================
@receiver(m2m_changed, sender=Project.members.through)
def update_project_chat_members(sender, instance, action, reverse, pk_set, **kwargs):
    """
    Syncs project members to the project chat group's manual_members.
    Runs on add/remove/clear of members.
    """
    if action not in ["post_add", "post_remove", "post_clear"]:
        return

    # Find the project chat group
    chat_group = ChatGroup.objects.filter(
        project=instance,
        group_type=ChatGroup.GROUP_TYPE_PROJECT
    ).first()

    if not chat_group:
        return

    # Get current member users
    member_users = User.objects.filter(employee__in=instance.members.all())
    member_user_ids = list(member_users.values_list('id', flat=True))

    # Update chat group members
    chat_group.manual_members.set(member_user_ids)