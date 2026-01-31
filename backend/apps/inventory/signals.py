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

# apps/inventory/signals.py   (or apps/stock/signals.py)

from .models import GRN, GRNItem
from apps.inventory.models import StockLedger   # adjust import path
from django.contrib.auth import get_user_model

User = get_user_model()

@receiver(post_save, sender=GRN)
def create_stock_entries_on_grn_approval(sender, instance: GRN, created, **kwargs):
    if created:
        return  # only act on updates

    # Only proceed if status changed to approved (or is now approved)
    if instance.status != 'approved':
        return

    # Optional: check if we already created ledger entries to avoid duplicates
    # (recommended if signal can run multiple times)
    existing = StockLedger.objects.filter(
        reference__startswith=f"GRN-{instance.grn_number}"
    ).exists()

    if existing:
        return

    user = None
    # Try to get the user who approved (if you store it somewhere)
    # If not available → use None or a system user

    for grn_item in instance.items.all():
        StockLedger.objects.create(
            item=grn_item.item,
            quantity=grn_item.received_qty,
            transaction_type='IN',
            reference=f"GRN-{instance.grn_number}",
            created_by=user,               # or request.user if in view
        )        