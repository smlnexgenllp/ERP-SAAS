from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.finance.views.budget import MonthlyBudgetViewSet
from apps.finance.views.department_budget import DepartmentBudgetViewSet

router = DefaultRouter()
router.register("monthly-budgets", MonthlyBudgetViewSet, basename="monthly-budget")
router.register("department-budgets", DepartmentBudgetViewSet, basename="department-budget")

urlpatterns = [
    path("", include(router.urls)),
]
