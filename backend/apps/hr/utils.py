# apps/hr/utils.py
from django.contrib.auth import get_user_model
from .models import Project

User = get_user_model()

def get_project_members(project_id):
    """
    Get all users who are members of a project.
    Returns: QuerySet of User objects
    """
    try:
        project = Project.objects.get(id=project_id)
        # Get employee IDs from project members
        employee_ids = project.members.values_list('id', flat=True)
        
        # Get corresponding User objects
        # Assuming Employee model has a OneToOne relation with User
        users = User.objects.filter(employee__id__in=employee_ids).distinct()
        return users
    except Project.DoesNotExist:
        return User.objects.none()
    except Exception as e:
        print(f"Error getting project members: {e}")
        return User.objects.none()

def get_project_member_ids(project_id):
    """
    Get list of user IDs who are members of a project.
    Returns: List of user IDs
    """
    users = get_project_members(project_id)
    return list(users.values_list('id', flat=True))