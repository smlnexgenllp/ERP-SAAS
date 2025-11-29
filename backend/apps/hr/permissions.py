from rest_framework.permissions import BasePermission

class IsHRManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.orguser.role == "hr_manager"


class IsEmployee(BasePermission):
    def has_permission(self, request, view):
        return request.user.orguser.role == "employee"
    
class IsHRManagerOrAdmin(BasePermission):
    def has_permission(self, request, view):
        try:
            return request.user.orguser.role in ["hr_manager", "admin"]
        except AttributeError:
            return False
