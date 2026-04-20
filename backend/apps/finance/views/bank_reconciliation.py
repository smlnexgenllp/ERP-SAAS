from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.finance.models.bank_reconciliation import BankAccount, BankTransaction
from apps.finance.serializers.bank_reconciliation import (
    BankAccountSerializer,
    BankTransactionSerializer,
)
# finance/views/bank_reconciliation.py
from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.sales.models import SalesPayment
from apps.inventory.models import VendorPayment


class BankReconciliationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization = request.user.organization

        records = []

        # Customer payments received
        sales_payments = SalesPayment.objects.filter(
            invoice__organization=organization
        ).select_related('invoice')

        for payment in sales_payments:
            records.append({
                "date": payment.payment_date if payment.payment_date else None,
                "reference": f"SPAY-{payment.id}",
                "description": f"Customer Payment - {payment.invoice.customer.full_name if payment.invoice and payment.invoice.customer else 'Customer'}",
                "type": "credit",
                "amount": float(payment.amount or 0),
                "status": "reconciled",
            })

        # Vendor payments made
        vendor_payments = VendorPayment.objects.filter(
            organization=organization
        ).select_related('invoice')

        for payment in vendor_payments:
            vendor_name = "Vendor"

            if payment.invoice and hasattr(payment.invoice, 'vendor'):
                vendor_name = getattr(payment.invoice.vendor, 'name', 'Vendor')

            records.append({
                "date": payment.payment_date if payment.payment_date else None,
                "reference": f"VPAY-{payment.id}",
                "description": f"Vendor Payment - {vendor_name}",
                "type": "debit",
                "amount": float(payment.amount or 0),
                "status": "reconciled",
            })

        records = sorted(
            records,
            key=lambda x: str(x['date']) if x['date'] else '',
            reverse=True
        )

        return Response(records)

class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all().order_by('-id')
    serializer_class = BankAccountSerializer


class BankTransactionViewSet(viewsets.ModelViewSet):
    queryset = BankTransaction.objects.all().order_by('-transaction_date')
    serializer_class = BankTransactionSerializer

    @action(detail=True, methods=['post'])
    def mark_matched(self, request, pk=None):
        transaction = self.get_object()
        transaction.reconciliation_status = 'matched'
        transaction.save()
        return Response({'message': 'Transaction marked as matched'})

    @action(detail=True, methods=['post'])
    def mark_mismatch(self, request, pk=None):
        transaction = self.get_object()
        transaction.reconciliation_status = 'mismatch'
        transaction.remarks = request.data.get('remarks', '')
        transaction.save()
        return Response({'message': 'Transaction marked as mismatch'})

