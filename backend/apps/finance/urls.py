from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CompanyViewSet, FinancialYearViewSet, AccountViewSet,
    OpeningBalanceViewSet, CustomerViewSet, VendorViewSet,
    BankAccountViewSet, TaxRateViewSet, ExpenseCategoryViewSet,
    TransactionViewSet, TransactionLineViewSet,  # ← ADDED
    PaymentViewSet, ReconciliationViewSet
)

router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'financial-years', FinancialYearViewSet)
router.register(r'accounts', AccountViewSet)
router.register(r'opening-balances', OpeningBalanceViewSet)
router.register(r'customers', CustomerViewSet)
router.register(r'vendors', VendorViewSet)
router.register(r'bank-accounts', BankAccountViewSet)
router.register(r'tax-rates', TaxRateViewSet)
router.register(r'expense-categories', ExpenseCategoryViewSet)
router.register(r'transactions', TransactionViewSet)
router.register(r'transaction-lines', TransactionLineViewSet)  # ← ADDED
router.register(r'payments', PaymentViewSet)
router.register(r'reconciliations', ReconciliationViewSet)

urlpatterns = [
    path('', include(router.urls)),
]