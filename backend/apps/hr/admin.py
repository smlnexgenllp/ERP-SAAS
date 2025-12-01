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




# @admin.register(EmployeeDocument)
# class EmployeeDocumentAdmin(admin.ModelAdmin):
# list_display = ('title', 'employee', 'uploaded_at')