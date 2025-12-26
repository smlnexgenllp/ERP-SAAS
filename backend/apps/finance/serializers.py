from rest_framework import serializers
from django.core.exceptions import ValidationError
from .models import (
    Company, FinancialYear, Account, OpeningBalance,
    Customer, Vendor, BankAccount, TaxRate, ExpenseCategory,
    Transaction, TransactionLine, Payment, Reconciliation
)


# ── 1. Company ───────────────────────────────────────────────────────────────
class CompanySerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')


# ── 2. Financial Year ────────────────────────────────────────────────────────
class FinancialYearSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = FinancialYear
        fields = [
            'id', 'company', 'company_name',
            'start_date', 'end_date', 'is_closed'
        ]
        read_only_fields = ['is_closed']

    def validate(self, data):
        if data['end_date'] <= data['start_date']:
            raise serializers.ValidationError({
                "end_date": "End date must be after start date"
            })
        return data


# ── 3. Account ───────────────────────────────────────────────────────────────
class AccountSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    parent_code = serializers.CharField(source='parent.code', read_only=True, allow_null=True)

    class Meta:
        model = Account
        fields = [
            'id', 'company', 'company_name',
            'parent', 'parent_name', 'parent_code',
            'name', 'code', 'type', 'is_group',
            'balance', 'tax_related'
        ]
        read_only_fields = ['balance', 'created_at', 'updated_at']

    def validate(self, data):
        parent = data.get('parent')
        if parent and not parent.is_group:
            raise serializers.ValidationError({
                "parent": "Parent account must be a group account (is_group=True)"
            })
        return data


# ── 4. Opening Balance ───────────────────────────────────────────────────────
class OpeningBalanceSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_type = serializers.CharField(source='account.type', read_only=True)
    financial_year_display = serializers.CharField(source='financial_year.__str__', read_only=True)

    class Meta:
        model = OpeningBalance
        fields = [
            'id',
            'account', 'account_name', 'account_code', 'account_type',
            'financial_year', 'financial_year_display',
            'amount', 'date',
            'created_at'
        ]
        read_only_fields = ['created_at']

    def validate(self, data):
        account = data['account']
        amount = data['amount']

        debit_types = ['ASSET', 'EXPENSE']
        credit_types = ['LIABILITY', 'INCOME', 'EQUITY', 'CAPITAL']

        if account.type in debit_types and amount < 0:
            raise serializers.ValidationError({
                "amount": f"{account.type} accounts should have positive (debit) opening balance"
            })

        if account.type in credit_types and amount > 0:
            raise serializers.ValidationError({
                "amount": f"{account.type} accounts should have negative or zero (credit) opening balance"
            })

        return data


# ── 5. Customer ──────────────────────────────────────────────────────────────
class CustomerSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Customer
        fields = [
            'id', 'company', 'company_name',
            'name', 'address', 'gst_number',
            'outstanding_balance'
        ]
        read_only_fields = ['outstanding_balance']


# ── 6. Vendor ────────────────────────────────────────────────────────────────
class VendorSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = Vendor
        fields = [
            'id', 'company', 'company_name',
            'name', 'address', 'gst_number',
            'outstanding_balance'
        ]
        read_only_fields = ['outstanding_balance']


class BankAccountSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)

    class Meta:
        model = BankAccount
        fields = [
            'id',
            'company', 'company_name',
            'name',                # nickname/display name
            'bank_name',
            'branch_name',
            'account_number',
            'ifsc_code',
            'micr_code',
            'account_type',
            'pan_number',
            'cin_number',
            'balance',
            'is_active',
            'opening_date',
            'notes',
        ]
        read_only_fields = ['balance']  # balance should be updated via transactions

class TaxRateSerializer(serializers.ModelSerializer):
    company_name = serializers.CharField(source='company.name', read_only=True)
    financial_year_display = serializers.CharField(source='financial_year.__str__', read_only=True, allow_null=True)

    class Meta:
        model = TaxRate
        fields = [
            'id',
            'company', 'company_name',
            'financial_year', 'financial_year_display',
            'name',
            'rate',
            'tax_type',
            'is_active',
            'effective_from',
            'hsn_sac_required',
            'notes',
        ]
        read_only_fields = ['company_name', 'financial_year_display']


# ── 9. Expense Category ──────────────────────────────────────────────────────
class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'company', 'name']
        read_only_fields = ['created_at']


# ── 10. Transaction Line (nested) ────────────────────────────────────────────
class TransactionLineSerializer(serializers.ModelSerializer):
    tax_rate_name = serializers.CharField(source='tax_rate.name', read_only=True, allow_null=True)

    class Meta:
        model = TransactionLine
        fields = [
            'id',
            'transaction',          # must be sent when creating/updating lines
            'description',
            'quantity',
            'rate',
            'amount',
            'tax_rate',
            'tax_rate_name',
            'tax_amount'
        ]
        read_only_fields = ['amount', 'tax_amount', 'id']


# ── 11. Transaction (main) ───────────────────────────────────────────────────
class TransactionSerializer(serializers.ModelSerializer):
    lines = TransactionLineSerializer(many=True, read_only=True)

    company_name = serializers.CharField(source='company.name', read_only=True)
    financial_year_display = serializers.CharField(source='financial_year.__str__', read_only=True)

    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    vendor_name = serializers.CharField(source='vendor.name', read_only=True, allow_null=True)
    bank_account_name = serializers.CharField(source='bank_account.name', read_only=True, allow_null=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'company', 'company_name',
            'financial_year', 'financial_year_display',
            'type',                     # SALES, PURCHASE, RECEIPT, PAYMENT, JOURNAL, etc.
            'date',
            'reference',
            'description',
            'customer', 'customer_name',
            'vendor', 'vendor_name',
            'bank_account', 'bank_account_name',
            'debit_account',
            'credit_account',
            'subtotal',
            'total_tax',
            'total_amount',
            'lines',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'subtotal', 'total_tax', 'total_amount',
            'created_at', 'updated_at',
            'company_name', 'financial_year_display',
            'customer_name', 'vendor_name', 'bank_account_name',
            'lines'
        ]

    def validate(self, data):
        transaction_type = data.get('type')

        # Basic business rule examples (customize as per your needs)
        if transaction_type in ['SALES', 'SALES_RETURN'] and not data.get('customer'):
            raise serializers.ValidationError({"customer": "Customer is required for sales transactions"})

        if transaction_type in ['PURCHASE', 'PURCHASE_RETURN'] and not data.get('vendor'):
            raise serializers.ValidationError({"vendor": "Vendor is required for purchase transactions"})

        if transaction_type in ['RECEIPT', 'PAYMENT'] and not data.get('bank_account'):
            raise serializers.ValidationError({"bank_account": "Bank account is required for receipt/payment"})

        return data


# ── 12. Payment ──────────────────────────────────────────────────────────────
class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


# ── 13. Reconciliation ───────────────────────────────────────────────────────
class ReconciliationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reconciliation
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']