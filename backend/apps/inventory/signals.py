from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import VendorInvoice, VendorPayment
from apps.inventory.models import StockLedger
from apps.finance.services.voucher_service import create_voucher

# =========================================================
# Vendor Invoice: Create Purchase Invoice voucher
# =========================================================
@receiver(post_save, sender=VendorInvoice)
def invoice_accounting(sender, instance, created, **kwargs):
    if created:
        create_voucher(
            voucher_type="Purchase Invoice",
            narration=f"Invoice {instance.invoice_number} for GRN {instance.grn.grn_number}",
            entries=[
                ("GRN Clearing", "Dr", instance.total_amount),
                ("Vendor", "Cr", instance.total_amount),
            ]
        )

# =========================================================
# Vendor Payment: Create Payment voucher
# =========================================================
@receiver(post_save, sender=VendorPayment)
def payment_accounting(sender, instance, created, **kwargs):
    if created:
        create_voucher(
            voucher_type="Vendor Payment",
            narration=f"Payment for Invoice {instance.invoice.invoice_number}",
            entries=[
                ("Vendor", "Dr", instance.amount),
                ("Bank", "Cr", instance.amount),
            ]
        )