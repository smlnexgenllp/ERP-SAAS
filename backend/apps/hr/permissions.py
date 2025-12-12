from rest_framework.permissions import BasePermission
from rest_framework import permissions
from apps.organizations.models import OrganizationUser

class IsHRManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.orguser.role == "hr_manager"


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.orguser.role == "employee"
    


class IsHRManagerOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        try:
            org_user = OrganizationUser.objects.get(user=request.user)
        except OrganizationUser.DoesNotExist:
            return False # Fails if user exists but has no OrganizationUser record
            
        # This is the critical line
        return org_user.role in ["Admin", "hr_manager"]
    
from rest_framework import permissions

class IsOwnerOrManager(permissions.BasePermission):
    """
    - Employee can create their own requests and read their own requests.
    - Managers (is_staff or has a group/flag) can list requests assigned to them and update status.
    """

    def has_object_permission(self, request, view, obj):
        # owner (employee) may view
        if getattr(obj, 'employee', None) == request.user:
            return True

        # manager: allow if user is manager or is staff and is the assigned manager
        if request.user.is_staff and getattr(obj, 'manager', None) == request.user:
            return True

        # superuser can do anything
        return request.user.is_superuser
