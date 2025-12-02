from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views.employee_views import (
    EmployeeViewSet,
    EmployeeDocumentViewSet,
    DepartmentViewSet,
    DesignationViewSet
)

router = DefaultRouter()
router.register('employees', EmployeeViewSet, basename='employees')
router.register('employee-documents', EmployeeDocumentViewSet, basename='employee-documents')
router.register('departments', DepartmentViewSet, basename='departments')
router.register('designations', DesignationViewSet, basename='designations')

urlpatterns = [
    path('', include(router.urls)),
]
