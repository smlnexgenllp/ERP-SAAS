from django.contrib import admin
from .models import (
Department, Designation, Employee
)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'organization', 'is_active')
    search_fields = ('name', 'code')




@admin.register(Designation)
class DesignationAdmin(admin.ModelAdmin):
    list_display = ('title', 'organization', 'grade')
    search_fields = ('title',)




@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'employee_code', 'organization', 'designation', 'department', 'is_active')
    search_fields = ('full_name', 'employee_code', 'email')
    list_filter = ('is_active', 'designation', 'department')

from django.contrib import admin
from .models import LeaveRequest, PermissionRequest

@admin.register(LeaveRequest)
class LeaveRequestAdmin(admin.ModelAdmin):
    list_display = ('employee', 'leave_type', 'start_date', 'end_date', 'status', 'manager', 'applied_at')
    list_filter = ('status', 'leave_type', 'manager')

@admin.register(PermissionRequest)
class PermissionRequestAdmin(admin.ModelAdmin):
    list_display = ('employee','date','time_from','time_to','status','manager','applied_at')
    list_filter = ('status','manager')



# @admin.register(EmployeeDocument)
# class EmployeeDocumentAdmin(admin.ModelAdmin):
# list_display = ('title', 'employee', 'uploaded_at')