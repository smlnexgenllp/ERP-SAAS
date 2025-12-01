# apps/hr/views/__init__.py

# from .department_views import DepartmentViewSet  # or whatever file name you use
# from .designation_views import DesignationViewSet
from .employee_views import EmployeeViewSet, DepartmentViewSet, DesignationViewSet

# OR if all viewsets are in one file, e.g., views.py or viewsets.py:
# from .viewsets import DepartmentViewSet, DesignationViewSet, EmployeeViewSet
# from .views import DepartmentViewSet, DesignationViewSet, EmployeeViewSet

__all__ = [
    'EmployeeViewSet',
    'DesignationViewSet',
    'DepartmentViewSet',
]