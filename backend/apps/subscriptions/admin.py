from django.contrib import admin
from .models import Module, SubscriptionPlan, Subscription, OrganizationModule, ModulePage,PlanModule

@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'app_name', 'is_active']
    list_filter = ['is_active', 'app_name']
    search_fields = ['name', 'code']

@admin.register(ModulePage)
class ModulePageAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'module', 'path', 'order', 'is_active']
    list_filter = ['module', 'is_active']
    search_fields = ['name', 'code', 'module__name']

@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'price', 'is_active']
    list_filter = ['is_active']
    search_fields = ['name', 'code']

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['organization', 'plan', 'status', 'start_date', 'end_date']
    list_filter = ['status', 'plan', 'is_trial']
    search_fields = ['organization__name', 'plan__name']

@admin.register(OrganizationModule)
class OrganizationModuleAdmin(admin.ModelAdmin):
    list_display = ['organization', 'module', 'is_active', 'granted_at']
    list_filter = ['is_active', 'module']
    search_fields = ['organization__name', 'module__name']

@admin.register(PlanModule)
class PlanModuleAdmin(admin.ModelAdmin):
    list_display = ['plan', 'module', 'is_included']
    list_filter = ['plan', 'module', 'is_included']
    search_fields = ['plan__name', 'module__name']    