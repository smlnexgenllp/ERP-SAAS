from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.employee_views import (
    EmployeeViewSet,
    EmployeeDocumentViewSet,
    DepartmentViewSet,
    DesignationViewSet
)
from .views.org_tree_views import (
    org_tree_view,              # Authenticated → requires login
    public_org_tree_view,       # Public → no login needed
)

router = DefaultRouter()
router.register('employees', EmployeeViewSet, basename='employees')
router.register('employee-documents', EmployeeDocumentViewSet, basename='employee-documents')
router.register('departments', DepartmentViewSet, basename='departments')
router.register('designations', DesignationViewSet, basename='designations')

urlpatterns = [
    path('', include(router.urls)),
     # 2. Organization Chart Endpoints
    path('org-tree/', org_tree_view, name='org-tree'),                    # Requires login
    path('public-org-tree/', public_org_tree_view, name='public-org-tree'),  # Public access
]
