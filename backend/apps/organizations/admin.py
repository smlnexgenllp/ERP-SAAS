# apps/organizations/admin.py

from django.contrib import admin
from .models import Organization

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('name', 'subdomain', 'organization_type', 'plan_tier', 'email', 'created_by', 'created_at')
    list_filter = ('organization_type', 'plan_tier', 'created_at')
    search_fields = ('name', 'subdomain', 'email', 'created_by__email', 'created_by__first_name')
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('name', 'subdomain', 'organization_type', 'plan_tier')
        }),
        ('Contact Info', {
            'fields': ('email', 'phone', 'address')
        }),
        ('Relations', {
            'fields': ('parent_organization', 'created_by')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )