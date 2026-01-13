from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.finance.views.budget import MonthlyBudgetViewSet
from apps.finance.views.department_budget import DepartmentBudgetViewSet
from apps.finance.views.vendor import VendorViewSet

router = DefaultRouter()
router.register("monthly-budgets", MonthlyBudgetViewSet, basename="monthly-budget")
router.register("department-budgets", DepartmentBudgetViewSet, basename="department-budget")
router.register(r"vendors", VendorViewSet, basename="vendor")

urlpatterns = [
    path("", include(router.urls)),
   
]
