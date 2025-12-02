# apps/hr/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

# ViewSets (CRUD)
from .views import (
    DepartmentViewSet,
    DesignationViewSet,
    EmployeeViewSet,
)

# Org Tree Views (the ones we just fixed)
from .views.org_tree_views import (
    org_tree_view,              # Authenticated → requires login
    public_org_tree_view,       # Public → no login needed
)

# Router for standard CRUD APIs
router = DefaultRouter()
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'designations', DesignationViewSet, basename='designation')
router.register(r'employees', EmployeeViewSet, basename='employee')

urlpatterns = [
    # 1. All ViewSet routes: /api/hr/departments/, /api/hr/employees/, etc.
    path('', include(router.urls)),

    # 2. Organization Chart Endpoints
    path('org-tree/', org_tree_view, name='org-tree'),                    # Requires login
    path('public-org-tree/', public_org_tree_view, name='public-org-tree'),  # Public access
]