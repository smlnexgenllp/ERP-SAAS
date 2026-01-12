from django.db import models
from .voucher import Voucher
from .chart_of_accounts import ChartOfAccount

class Transaction(models.Model):
    voucher = models.ForeignKey(
        Voucher,
        related_name="transactions",
        on_delete=models.CASCADE
    )
    account = models.ForeignKey(
        ChartOfAccount,
        on_delete=models.PROTECT
    )
    debit = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=15, decimal_places=2, default=0)

    def clean(self):
        if self.debit > 0 and self.credit > 0:
            raise ValueError("Only debit or credit allowed")

        if self.debit == 0 and self.credit == 0:
            raise ValueError("Either debit or credit required")
