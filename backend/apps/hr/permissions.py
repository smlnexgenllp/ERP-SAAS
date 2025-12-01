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