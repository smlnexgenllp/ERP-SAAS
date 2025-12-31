from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'role', 'get_organization', 'is_active')
    list_filter = ('role', 'is_active')
    
    fieldsets = UserAdmin.fieldsets + (
        ('ERP Information', {'fields': ('role', 'phone')}),
    )
    
    def get_organization(self, obj):
        return obj.organization.name if obj.organization else "No Organization"
    get_organization.short_description = 'Organization'
    get_organization.admin_order_field = 'organization__name'