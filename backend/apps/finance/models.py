from django.db import models
from django.conf import settings
from django.utils import timezone


# 1. Company Setup
class Company(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField()
    gst_number = models.CharField(max_length=15, blank=True, default='')
    pan_number = models.CharField(max_length=10, blank=True, default='')
    cin_number = models.CharField(max_length=21, blank=True, default='')
    base_currency = models.CharField(max_length=3, default='INR')
    time_zone = models.CharField(max_length=50, default='Asia/Kolkata')
    accounting_standards = models.CharField(max_length=50, default='Indian GAAP')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,  # ← Critical fix: allows creating company without user/login
    )

    class Meta:
        verbose_name_plural = "Companies"

    def __str__(self):
        return self.name


# 2. Financial Year Setup
class FinancialYear(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='financial_years')
    start_date = models.DateField()
    end_date = models.DateField()
    is_closed = models.BooleanField(default=False)

    class Meta:
        unique_together = ('company', 'start_date')
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.start_date.year}-{self.end_date.year} ({self.company.name})"


# 3. Chart of Accounts (Improved Hierarchical Version)
class Account(models.Model):
    ACCOUNT_TYPES = (
        ('ASSET', 'Asset'),
        ('LIABILITY', 'Liability'),
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
        ('EQUITY', 'Equity'),
    )

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='accounts')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=10, choices=ACCOUNT_TYPES)
    code = models.CharField(max_length=20, unique=True, help_text="e.g., 1001, 2100-01")  # Longer for sub-codes
    is_group = models.BooleanField(default=False, help_text="True for Group (e.g., Current Assets), False for Ledger")
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    tax_related = models.BooleanField(default=False, help_text="Mark for GST/TDS accounts")

    class Meta:
        unique_together = ('company', 'code')
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name} ({self.get_type_display()}) {'[Group]' if self.is_group else ''}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.parent and not self.parent.is_group:
            raise ValidationError("Parent account must be a Group.")
        if self.is_group and self.parent is None:
            # Root groups allowed
            pass


# 4. Opening Balances
class OpeningBalance(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    financial_year = models.ForeignKey(FinancialYear, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    date = models.DateField(auto_now_add=True)

    class Meta:
        unique_together = ('account', 'financial_year')

    def __str__(self):
        return f"Opening {self.amount} for {self.account} in {self.financial_year}"


# 5. Master Data
class Customer(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='customers')
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    gst_number = models.CharField(max_length=15, blank=True, default='')
    outstanding_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name


class Vendor(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='vendors')
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    gst_number = models.CharField(max_length=15, blank=True, default='')
    outstanding_balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)

    def __str__(self):
        return self.name


class BankAccount(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='bank_accounts')
    
    # Basic Identification
    name = models.CharField(max_length=255, help_text="Bank name + branch or account nickname")
    bank_name = models.CharField(max_length=100, blank=True)          # e.g. "State Bank of India"
    branch_name = models.CharField(max_length=100, blank=True)       # Branch name
    account_number = models.CharField(max_length=50, unique=True)
    
    # Important Banking Details
    ifsc_code = models.CharField(max_length=11, blank=True, help_text="IFSC Code (11 characters)")
    micr_code = models.CharField(max_length=9, blank=True, null=True, help_text="MICR Code (9 digits)")
    account_type = models.CharField(
        max_length=20,
        choices=[
            ('savings', 'Savings Account'),
            ('current', 'Current Account'),
            ('cc', 'Cash Credit'),
            ('od', 'Overdraft'),
            ('fixed_deposit', 'Fixed Deposit'),
            ('other', 'Other'),
        ],
        default='savings'
    )
    
    # Additional Identification (useful for compliance)
    pan_number = models.CharField(max_length=10, blank=True, help_text="PAN linked to account (optional)")
    cin_number = models.CharField(max_length=21, blank=True, help_text="For company accounts")
    
    # Financial
    balance = models.DecimalField(max_digits=15, decimal_places=2, default=0.00)
    
    # Status & Notes
    is_active = models.BooleanField(default=True)
    opening_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['name']
        verbose_name = "Bank Account"
        verbose_name_plural = "Bank Accounts"

    def __str__(self):
        return f"{self.name} - {self.account_number} ({self.bank_name or 'Bank'})"


class TaxRate(models.Model):
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='tax_rates')
    financial_year = models.ForeignKey(
        'FinancialYear', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='tax_rates',
        help_text="Tax rate applicable for this financial year"
    )
    
    name = models.CharField(max_length=100, help_text="e.g. GST 18%, GST 12%, IGST 5%")  # Increased length
    rate = models.DecimalField(max_digits=5, decimal_places=2)  # e.g. 18.00, 5.00
    
    # GST Specific (very useful in India)
    tax_type = models.CharField(
        max_length=20,
        choices=[
            ('CGST', 'CGST'),
            ('SGST', 'SGST'),
            ('IGST', 'IGST'),
            ('UTGST', 'UTGST'),
            ('VAT', 'VAT'),
            ('CESS', 'CESS'),
            ('OTHER', 'Other'),
        ],
        default='IGST'
    )
    
    is_active = models.BooleanField(default=True, help_text="Is this tax rate currently applicable?")
    effective_from = models.DateField(default=timezone.now, help_text="Date from which this rate applies")
    hsn_sac_required = models.BooleanField(default=True, help_text="Requires HSN/SAC code on invoices?")
    
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-rate', 'name']
        unique_together = ['company', 'financial_year', 'name']  # Prevent duplicates

    def __str__(self):
        return f"{self.name} ({self.rate}%) - {self.company}"


class ExpenseCategory(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='expense_categories')
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


# 6. Transaction Entry - IMPROVED WITH LINE ITEMS
class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('SALE', 'Sales Invoice'),
        ('PURCHASE', 'Purchase Bill'),
        ('EXPENSE', 'Expense Entry'),
        ('PAYROLL', 'Payroll'),
        ('JOURNAL', 'Manual Journal'),
        ('PAYMENT', 'Payment Made'),
        ('RECEIPT', 'Payment Received'),
    )

    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='transactions')
    financial_year = models.ForeignKey(FinancialYear, on_delete=models.CASCADE)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    date = models.DateField()
    reference = models.CharField(max_length=100, blank=True, help_text="Invoice/Bill No.")
    description = models.TextField(blank=True)

    # Party links
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchases')

    # Bank/Cash for payments/receipts
    bank_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)

    # Totals (calculated from lines)
    subtotal = models.DecimalField(max_digits=15, decimal_places=2, default=0.00, editable=False)
    total_tax = models.DecimalField(max_digits=15, decimal_places=2, default=0.00, editable=False)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00, editable=False)

    # Manual journals need direct accounts
    debit_account = models.ForeignKey(
        Account, related_name='debit_transactions', on_delete=models.PROTECT, null=True, blank=True
    )
    credit_account = models.ForeignKey(
        Account, related_name='credit_transactions', on_delete=models.PROTECT, null=True, blank=True
    )

    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-date', '-id']

    def __str__(self):
        party = self.customer.name if self.customer else (self.vendor.name if self.vendor else 'N/A')
        return f"{self.get_type_display()} - {party} - ₹{self.total_amount} on {self.date}"

    def save(self, *args, **kwargs):
        # Recalculate totals from line items
        lines = self.lines.all() if self.pk else []
        if lines:
            self.subtotal = sum(line.amount for line in lines)
            self.total_tax = sum(line.tax_amount for line in lines)
            self.total_amount = self.subtotal + self.total_tax
        else:
            self.subtotal = self.total_tax = self.total_amount = 0.00

        is_new = self.pk is None
        old_instance = None
        if not is_new:
            old_instance = Transaction.objects.get(pk=self.pk)

        super().save(*args, **kwargs)

        # Reverse previous posting if updating (basic - we'll improve later)
        if old_instance and old_instance.total_amount != self.total_amount:
            # Simple reverse not implemented fully - for now just apply new
            pass

        # Apply new posting
        if self.type in ['SALE', 'PURCHASE', 'EXPENSE', 'PAYROLL']:
            self._post_invoice_purchase()
        elif self.type == 'JOURNAL':
            self._post_journal()
        elif self.type in ['PAYMENT', 'RECEIPT']:
            self._post_payment_receipt()

    def _post_invoice_purchase(self):
        total = self.total_amount
        if total == 0:
            return

        if self.type == 'SALE':
            receivable = self._get_or_create_account('Accounts Receivable', 'ASSET', '1200')
            sales = self._get_or_create_account('Sales Revenue', 'INCOME', '4001')

            receivable.balance += total        # Debit
            sales.balance -= total             # Credit
            receivable.save()
            sales.save()

            if self.customer:
                self.customer.outstanding_balance += total
                self.customer.save()

        elif self.type == 'PURCHASE':
            payable = self._get_or_create_account('Accounts Payable', 'LIABILITY', '2100')
            purchases = self._get_or_create_account('Purchases', 'EXPENSE', '5001')

            payable.balance -= total           # Credit
            purchases.balance += total         # Debit
            payable.save()
            purchases.save()

            if self.vendor:
                self.vendor.outstanding_balance += total
                self.vendor.save()

        elif self.type == 'EXPENSE':
            expense = self._get_or_create_account('General Expenses', 'EXPENSE', '6001')
            cash_bank = self.bank_account or self._get_or_create_account('Cash', 'ASSET', '1001')

            cash_bank.balance -= total
            expense.balance += total
            cash_bank.save()
            expense.save()

    def _get_or_create_account(self, name, acc_type, code):
        try:
            return Account.objects.get(company=self.company, code=code)
        except Account.DoesNotExist:
            return Account.objects.create(
                company=self.company,
                name=name,
                type=acc_type,
                code=code,
                is_group=False,
                balance=0.00
            )

    def _post_journal(self):
        if not self.debit_account or not self.credit_account or self.total_amount == 0:
            return

        total = self.total_amount

        # Debit
        if self.debit_account.type in ['ASSET', 'EXPENSE']:
            self.debit_account.balance += total
        else:
            self.debit_account.balance -= total
        self.debit_account.save()

        # Credit
        if self.credit_account.type in ['LIABILITY', 'INCOME', 'EQUITY']:
            self.credit_account.balance += total
        else:
            self.credit_account.balance -= total
        self.credit_account.save()

    def _post_payment_receipt(self):
        if not self.bank_account or self.total_amount == 0:
            return

        if self.type == 'RECEIPT':
            self.bank_account.balance += self.total_amount
            if self.customer:
                self.customer.outstanding_balance -= self.total_amount
                self.customer.save()
        elif self.type == 'PAYMENT':
            self.bank_account.balance -= self.total_amount
            if self.vendor:
                self.vendor.outstanding_balance -= self.total_amount
                self.vendor.save()

        self.bank_account.save()

    def _post_from_lines(self):
        total = self.total_amount
        # Clear previous postings? (Advanced: use reversal entries)

        if self.type == 'SALE':
            # Debit: Customer (Receivable) or Bank
            debit_acc = self.customer.account if hasattr(self.customer, 'account') else None  # We'll link later
            # Or use default Receivable account
            receivable_acc = Account.objects.filter(company=self.company, name__icontains='Receivable').first()
            credit_acc = Account.objects.filter(company=self.company, name__icontains='Sales').first()

            # Update balances (simplified)
            if receivable_acc:
                receivable_acc.balance += total
                receivable_acc.save()
            if credit_acc:
                credit_acc.balance += total  # Credit sales
                credit_acc.save()

            # Update customer outstanding
            if self.customer:
                self.customer.outstanding_balance += total
                self.customer.save()

        elif self.type == 'PURCHASE':
            payable_acc = Account.objects.filter(company=self.company, name__icontains='Payable').first()
            purchase_acc = Account.objects.filter(company=self.company, name__icontains='Purchase').first()

            if payable_acc:
                payable_acc.balance -= total  # Credit payable
                payable_acc.save()
            if purchase_acc:
                purchase_acc.balance += total  # Debit purchase
                purchase_acc.save()

            if self.vendor:
                self.vendor.outstanding_balance += total
                self.vendor.save()

        # Add more types as needed

    def _post_journal(self):
        if self.debit_account and self.credit_account and self.total_amount > 0:
            total = self.total_amount

            # Debit side
            if self.debit_account.type in ['ASSET', 'EXPENSE']:
                self.debit_account.balance += total
            else:
                self.debit_account.balance -= total
            self.debit_account.save()

            # Credit side
            if self.credit_account.type in ['LIABILITY', 'INCOME', 'EQUITY']:
                self.credit_account.balance += total
            else:
                self.credit_account.balance -= total
            self.credit_account.save()

    def _post_payment_receipt(self):
        if self.bank_account and self.total_amount > 0:
            if self.type == 'PAYMENT':
                self.bank_account.balance -= self.total_amount
            elif self.type == 'RECEIPT':
                self.bank_account.balance += self.total_amount
            self.bank_account.save()

            # Reduce outstanding
            if self.customer and self.type == 'RECEIPT':
                self.customer.outstanding_balance -= self.total_amount
                self.customer.save()
            if self.vendor and self.type == 'PAYMENT':
                self.vendor.outstanding_balance -= self.total_amount
                self.vendor.save()


# Line Items for Invoices/Bills
class TransactionLine(models.Model):
    transaction = models.ForeignKey(Transaction, on_delete=models.CASCADE, related_name='lines')
    description = models.CharField(max_length=255, help_text="Item/Service name")
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1.00)
    rate = models.DecimalField(max_digits=15, decimal_places=2)
    amount = models.DecimalField(max_digits=15, decimal_places=2, editable=False)  # qty * rate
    tax_rate = models.ForeignKey(TaxRate, on_delete=models.SET_NULL, null=True, blank=True)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=0.00, editable=False)

    def save(self, *args, **kwargs):
        self.amount = self.quantity * self.rate
        if self.tax_rate:
            self.tax_amount = self.amount * (self.tax_rate.rate / 100)
        else:
            self.tax_amount = 0.00
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.description} - {self.quantity} x {self.rate}"
    
    


# 9. Payment & Receipt
class Payment(models.Model):
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name='payments')
    date = models.DateField()
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    from_account = models.ForeignKey(BankAccount, related_name='outgoing_payments', on_delete=models.PROTECT, null=True, blank=True)
    to_customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    to_vendor = models.ForeignKey(Vendor, on_delete=models.SET_NULL, null=True, blank=True)
    linked_transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        # Reduce outstanding
        if self.to_customer:
            self.to_customer.outstanding_balance -= self.amount
            self.to_customer.save()
        if self.to_vendor:
            self.to_vendor.outstanding_balance -= self.amount
            self.to_vendor.save()

        # Reduce bank balance
        if self.from_account:
            self.from_account.balance -= self.amount
            self.from_account.save()

    def __str__(self):
        return f"Payment {self.amount} on {self.date}"


# 12. Reconciliation
class Reconciliation(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    date = models.DateField()
    matched_amount = models.DecimalField(max_digits=15, decimal_places=2)
    mismatch_note = models.TextField(blank=True)

    def __str__(self):
        return f"Reconciliation {self.date} - {self.account}"