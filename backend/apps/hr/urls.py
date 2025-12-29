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
    send_offer_email,generate_offer_letter_pdf,send_direct_offer,
    late_punch_requests, handle_late_request, monthly_attendance_report,AttendanceListView,today_attendance
)
from .views.org_tree_views import (
    org_tree_view,              
    public_org_tree_view,     
)
from .views.task_views import TaskViewSet, DailyChecklistViewSet,performance_report, project_updates,ProjectViewSet
from .views.chat_views import (ChatGroupViewSet, group_messages, upload_chat_file, create_custom_chat_group,get_project_chat_members,get_pinned_messages)
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
router.register(r'chat/groups', ChatGroupViewSet, basename='chat-groups')

urlpatterns = [
    path('', include(router.urls)),
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

    path("performance-report/", performance_report, name='performance-report'),
    path("projects/<int:project_id>/updates/", project_updates, name='project-updates'),

     # Chat endpoints (separate from router for custom actions)
    path('chat/groups/<int:group_id>/messages/', group_messages, name='chat-group-messages'),
    path('chat/upload-file/', upload_chat_file, name='chat-file-upload'),
    path('chat/groups/create/', create_custom_chat_group, name='create-custom-chat-group'),
    path('chat/groups/create-project-chat/', ChatGroupViewSet.as_view({'post': 'create_project_chat'}), name='create-project-chat'),
     # New endpoint to get project chat members
    path('projects/<int:project_id>/chat-members/', get_project_chat_members, name='project-chat-members'),
    path('chat/groups/<int:group_id>/pinned/', get_pinned_messages, name='chat-pinned-messages'),

]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)