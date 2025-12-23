# apps/hr/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static

# Import all views from employee_views
from .views.employee_views import (
    DepartmentViewSet,
    DesignationViewSet,
    accept_invite_view,
    LeaveRequestViewSet, 
    PermissionRequestViewSet, 
    ManagerListView,
    ManagerLeaveList,
    ManagerPermissionList,
    EmployeeReimbursementViewSet,
    EmployeeViewSet,
    EmployeeDocumentViewSet,
    # Import payroll views
    get_organization_employees,
    salary_list_create,
    get_employee_salary,
    get_current_organization,
    punch_in, punch_out,
    late_punch_requests, handle_late_request, monthly_attendance_report,AttendanceListView,today_attendance
)

# Org Tree Views
from .views.org_tree_views import (
    org_tree_view,              
    public_org_tree_view,     
)

# Router for standard CRUD APIs
router = DefaultRouter()
router.register('employees', EmployeeViewSet, basename='employees')
router.register('employee-documents', EmployeeDocumentViewSet, basename='employee-documents')
router.register('departments', DepartmentViewSet, basename='departments')
router.register('designations', DesignationViewSet, basename='designations')
router.register(r'leave-requests', LeaveRequestViewSet, basename='leave-requests')
router.register(r'permission', PermissionRequestViewSet, basename='permission')
router.register(r'managers', ManagerListView, basename='managers')
router.register(r'reimbursements', EmployeeReimbursementViewSet, basename="reimbursements")

urlpatterns = [
    # 1. All ViewSet routes: /api/hr/departments/, /api/hr/employees/, etc.
    path('', include(router.urls)),

    # 2. Organization Chart Endpoints
    path('org-tree/', org_tree_view, name='org-tree'),                    # Requires login
    path('public-org-tree/', public_org_tree_view, name='public-org-tree'),  # Public access
    path('employees/accept-invite/<uuid:token>/', accept_invite_view, name='accept-invite'),
    path("manager/leave-requests/", ManagerLeaveList.as_view()),
    path("manager/permission-requests/", ManagerPermissionList.as_view()),

    # 3. Payroll endpoints - Only include the views you have
    path('payroll/organization/', get_current_organization, name='current-organization'),
    path('payroll/employees/', get_organization_employees, name='organization-employees'),
    path('payroll/salary/', salary_list_create, name='salary-list-create'),
    path('payroll/salary/<int:employee_id>/', get_employee_salary, name='get-employee-salary'),
    
    # Remove these for now since you don't have the functions:
    # path('payroll/salary/<int:employee_id>/', salary_detail, name='salary-detail'),
    # path('payroll/invoice/generate/', generate_invoice, name='generate-invoice'),
    # path('payroll/invoice/', invoice_list, name='invoice-list'),
    # path('payroll/invoice/<int:invoice_id>/', invoice_detail, name='invoice-detail'),
    # path('payroll/invoice/download/<int:invoice_id>/', download_invoice, name='download-invoice'),
    path("attendance/punch-in/", punch_in, name="employee-punch-in"),
    path("attendance/punch-out/", punch_out, name="employee-punch-out"),
    path("attendance/late-requests/", late_punch_requests, name="late-requests"),
    path("attendance/late-requests/<int:pk>/", handle_late_request, name="late-request-action"),
    path("attendance/monthly/", monthly_attendance_report, name="monthly-report"),
    path("attendance/", AttendanceListView.as_view(), name="attendance-list"),
    path("attendance/today/", today_attendance),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)