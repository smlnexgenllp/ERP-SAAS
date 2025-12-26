from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from .models import (
    Company, FinancialYear, Account, OpeningBalance,
    Customer, Vendor, BankAccount, TaxRate, ExpenseCategory,
    Transaction, TransactionLine, Payment, Reconciliation
)
from .serializers import (
    CompanySerializer, FinancialYearSerializer, AccountSerializer,
    OpeningBalanceSerializer, CustomerSerializer, VendorSerializer,
    BankAccountSerializer, TaxRateSerializer, ExpenseCategorySerializer,
    TransactionSerializer, TransactionLineSerializer,
    PaymentSerializer, ReconciliationSerializer
)


# ──────────────────────────────────────────────────────────────────────────────
# Common base class for all ViewSets
# ──────────────────────────────────────────────────────────────────────────────
class StandardViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet for master data and transactions.
    Use IsAuthenticated + company-based permissions in production!
    """
    permission_classes = [permissions.AllowAny]  # ← CHANGE TO IsAuthenticated later!

    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    ordering_fields = '__all__'       # Allow client-side ordering via ?ordering=field,-field
    # NO global default ordering here → prevents FieldError on models without created_at


# ── Master Data ViewSets ─────────────────────────────────────────────────────

class CompanyViewSet(StandardViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer
    search_fields = ['name', 'gst_number', 'pan_number', 'cin_number']
    ordering = ['name']               # safe default - most people sort companies by name


class FinancialYearViewSet(StandardViewSet):
    queryset = FinancialYear.objects.select_related('company').all()
    serializer_class = FinancialYearSerializer
    filterset_fields = ['company', 'is_closed']
    search_fields = ['start_date', 'end_date']
    ordering = ['-start_date']        # newest financial year first


class AccountViewSet(StandardViewSet):
    queryset = Account.objects.select_related('company', 'parent').all()
    serializer_class = AccountSerializer
    filterset_fields = ['company', 'type', 'is_group', 'parent', 'tax_related']
    search_fields = ['name', 'code']
    ordering = ['code', 'name']       # typical chart of accounts sorting


class OpeningBalanceViewSet(StandardViewSet):
    queryset = OpeningBalance.objects.select_related('account', 'financial_year').all()
    serializer_class = OpeningBalanceSerializer
    filterset_fields = ['account', 'financial_year', 'account__company']
    search_fields = ['account__name', 'account__code']
    ordering = ['-date', 'account__code']

    def perform_create(self, serializer):
        instance = serializer.save()
        instance.account.balance = instance.account.balance + instance.amount
        instance.account.save(update_fields=['balance'])

    def perform_update(self, serializer):
        old = self.get_object()
        old_amount = old.amount

        instance = serializer.save()
        delta = instance.amount - old_amount
        instance.account.balance += delta
        instance.account.save(update_fields=['balance'])

    def perform_destroy(self, instance):
        instance.account.balance -= instance.amount
        instance.account.save(update_fields=['balance'])
        instance.delete()


class CustomerViewSet(StandardViewSet):
    queryset = Customer.objects.select_related('company').all()
    serializer_class = CustomerSerializer
    filterset_fields = ['company']
    search_fields = ['name', 'gst_number']
    ordering = ['name']


class VendorViewSet(StandardViewSet):
    queryset = Vendor.objects.select_related('company').all()
    serializer_class = VendorSerializer
    filterset_fields = ['company']
    search_fields = ['name', 'gst_number']
    ordering = ['name']


class BankAccountViewSet(StandardViewSet):
    queryset = BankAccount.objects.select_related('company').all()
    serializer_class = BankAccountSerializer
    filterset_fields = ['company']
    search_fields = ['name', 'account_number']
    ordering = ['name']


class TaxRateViewSet(StandardViewSet):
    queryset = TaxRate.objects.select_related('company', 'financial_year').all()
    serializer_class = TaxRateSerializer
    filterset_fields = ['company', 'financial_year', 'tax_type', 'is_active']
    search_fields = ['name', 'tax_type']
    ordering = ['-rate', 'name']


class ExpenseCategoryViewSet(StandardViewSet):
    queryset = ExpenseCategory.objects.select_related('company').all()
    serializer_class = ExpenseCategorySerializer
    filterset_fields = ['company']
    search_fields = ['name']
    ordering = ['name']


# ── Transactions & Related ───────────────────────────────────────────────────

class TransactionViewSet(StandardViewSet):
    queryset = Transaction.objects.select_related(
        'company', 'financial_year', 'customer', 'vendor', 'bank_account',
        'debit_account', 'credit_account'
    ).prefetch_related('lines__tax_rate').all()

    serializer_class = TransactionSerializer

    filterset_fields = [
        'company', 'financial_year', 'type', 'date',
        'customer', 'vendor', 'bank_account'
    ]
    search_fields = ['reference', 'description', 'customer__name', 'vendor__name']
    ordering = ['-date', '-created_at']   # newest transactions first (if created_at exists)


class TransactionLineViewSet(StandardViewSet):
    """
    Usually accessed via ?transaction=ID or ?transaction__company=ID
    """
    queryset = TransactionLine.objects.select_related(
        'transaction', 'transaction__company', 'tax_rate'
    ).all()
    serializer_class = TransactionLineSerializer

    filterset_fields = ['transaction', 'transaction__company', 'tax_rate']
    search_fields = ['description']
    ordering = ['id']                    # preserve original order


class PaymentViewSet(StandardViewSet):
    queryset = Payment.objects.select_related(
        'company', 'financial_year', 'party', 'bank_account'
    ).all()
    serializer_class = PaymentSerializer
    filterset_fields = ['company', 'financial_year', 'payment_type', 'date']
    search_fields = ['reference', 'description']
    ordering = ['-date']


class ReconciliationViewSet(StandardViewSet):
    queryset = Reconciliation.objects.select_related(
        'bank_account', 'financial_year'
    ).prefetch_related('items').all()
    serializer_class = ReconciliationSerializer
    filterset_fields = ['bank_account', 'financial_year', 'status', 'date']
    ordering = ['-date']