# apps/hr/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

# ViewSets (CRUD)
from .views import (
    DepartmentViewSet,
    DesignationViewSet,
    accept_invite_view,
    LeaveRequestViewSet, 
    PermissionRequestViewSet, 
    ManagerListView,
    ManagerLeaveList,
    ManagerPermissionList,
    EmployeeReimbursementViewSet,
    punch_in, punch_out,
    late_punch_requests, handle_late_request, monthly_attendance_report,AttendanceListView,today_attendance
)

# Org Tree Views (the ones we just fixed)
from .views.org_tree_views import (
    org_tree_view,              
    public_org_tree_view,     
)
from django.conf import settings
from django.conf.urls.static import static

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