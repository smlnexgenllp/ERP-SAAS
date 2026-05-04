from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.finance.views.budget import MonthlyBudgetViewSet, DepartmentAllocationView
from apps.finance.views.department_budget import DepartmentBudgetViewSet
from apps.finance.views.vendor import VendorViewSet
from apps.finance.views.bank_reconciliation import BankAccountViewSet, BankReconciliationView, BankTransactionViewSet
from apps.finance.views.gst_reconciliation import GSTReconciliationView
from apps.finance.views.reports import ProfitLossReportView, BalanceSheetView
router = DefaultRouter()
router.register("monthly-budgets", MonthlyBudgetViewSet, basename="monthly-budget")
router.register("department-budgets", DepartmentBudgetViewSet, basename="department-budget")
router.register(r"vendors", VendorViewSet, basename="vendor")
router.register(r'bank-accounts', BankAccountViewSet)
router.register(r'bank-transactions', BankTransactionViewSet)
# router.register(r'gst-reconciliation', GSTReconciliationViewSet)

urlpatterns = [
    path("", include(router.urls)),
    # urls.py
path('monthly-budgets/<int:pk>/allocations/', DepartmentAllocationView.as_view()),
path('bank-reconciliation/', BankReconciliationView.as_view(), name='bank-reconciliation'),
path('gst-reconciliation/', GSTReconciliationView.as_view(), name='gst-reconciliation'),
path('profit-loss/', ProfitLossReportView.as_view(), name='profit-loss-report'),
path('balance-sheet/', BalanceSheetView.as_view(), name='balance-sheet-report'),
]
