from rest_framework import permissions

class IsMainOrganizationAdmin(permissions.BasePermission):
    """Allows access only to main organization admins"""
    
    def has_permission(self, request, view):
        user = request.user
        if not user.is_authenticated:
            return False
        
        # Check if user belongs to a main organization
        if not hasattr(user, 'organization') or not user.organization:
            return False
        
        # Check if user's organization is a main organization
        if not user.organization.is_main_organization:
            return False
        
        # Check if user has appropriate role
        return user.role in ['super_admin', 'main_org_admin']