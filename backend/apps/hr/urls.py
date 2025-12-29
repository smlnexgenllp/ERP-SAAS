# apps/hr/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.conf import settings
from django.conf.urls.static import static
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
    get_organization_employees,
    salary_list_create,
    get_employee_salary,
    get_current_organization,
    punch_in, punch_out,
    JobOpeningViewSet, ReferralViewSet,
    send_offer_email,generate_offer_letter_pdf,send_direct_offer,PayrollAttendanceSummary,generate_payroll_invoice,
    late_punch_requests, handle_late_request, monthly_attendance_report,AttendanceListView,today_attendance
,payroll_attendance_summary,InvoiceListView,
InvoiceListView,
    InvoiceDetailView,)
from .views.org_tree_views import (
    org_tree_view,              
    public_org_tree_view,     
)
from .views.payslip_views import(
    generate_payslip_pdf,
)
from .views.task_views import TaskViewSet, DailyChecklistViewSet,performance_report, project_updates,ProjectViewSet
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
router.register("job-openings", JobOpeningViewSet)
router.register("referrals", ReferralViewSet)
router.register(r'tasks', TaskViewSet)
router.register(r'daily-checklists', DailyChecklistViewSet)
router.register(r'projects', ProjectViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('org-tree/', org_tree_view, name='org-tree'),                    # Requires login
    path('public-org-tree/', public_org_tree_view, name='public-org-tree'),  # Public access
    path('employees/accept-invite/<uuid:token>/', accept_invite_view, name='accept-invite'),
    path("manager/leave-requests/", ManagerLeaveList.as_view()),
    path("manager/permission-requests/", ManagerPermissionList.as_view()),
    path('payroll/payslip/<uuid:invoice_id>/pdf/', generate_payslip_pdf, name='payslip-pdf'),

    # 3. Payroll endpoints - Only include the views you have
    path('payroll/organization/', get_current_organization, name='current-organization'),
    path('payroll/employees/', get_organization_employees, name='organization-employees'),
    path('payroll/salary/', salary_list_create, name='salary-list-create'),
    path('payroll/salary/<int:employee_id>/', get_employee_salary, name='get-employee-salary'),
    path("attendance/punch-in/", punch_in, name="employee-punch-in"),
    path("attendance/punch-out/", punch_out, name="employee-punch-out"),
    path("attendance/late-requests/", late_punch_requests, name="late-requests"),
    path("attendance/late-requests/<int:pk>/", handle_late_request, name="late-request-action"),
    path("attendance/monthly/", monthly_attendance_report, name="monthly-report"),
    path("attendance/", AttendanceListView.as_view(), name="attendance-list"),
    path("attendance/today/", today_attendance),
    path("referrals/<int:id>/send-offer/", send_offer_email),
    path("referrals/<int:id>/offer-letter/", generate_offer_letter_pdf),
    path('send-direct-offer/', send_direct_offer),
    path('generate-invoices/', generate_payroll_invoice, name="generate_invoice"),
    path('attendance-summary/', payroll_attendance_summary),
    path('invoices/', InvoiceListView.as_view()),  # Add a list view later
    path("performance-report/", performance_report, name='performance-report'),
    path("projects/<int:project_id>/updates/", project_updates, name='project-updates'),
    path('payroll/invoices/', InvoiceListView.as_view(), name='invoice-list'),
    path('payroll/invoices/<uuid:pk>/', InvoiceDetailView.as_view(), name='invoice-detail'),

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)