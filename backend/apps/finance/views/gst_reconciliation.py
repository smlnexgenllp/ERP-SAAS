from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.finance.models.gst_reconciliation import GSTReconciliation
from apps.finance.serializers.gst_reconciliation import GSTReconciliationSerializer

from apps.sales.models import SalesInvoice


class GSTReconciliationView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization = request.user.organization

        invoices = SalesInvoice.objects.filter(
            organization=organization
        ).select_related('customer')

        records = []

        for invoice in invoices:
            customer_name = 'Customer'
            gstin = '-'

            if invoice.customer:
                customer_name = getattr(invoice.customer, 'full_name', 'Customer')
                gstin = getattr(invoice.customer, 'gstin', '-')

            records.append({
                "id": invoice.id,
                "reconciliation_month": invoice.invoice_date.strftime('%b %Y') if invoice.invoice_date else '-',
                "invoice_number": invoice.invoice_number if invoice.invoice_number else f"INV-{invoice.id}",
                "customer_name": customer_name,
                "gstin": gstin,
                "taxable_amount": float(invoice.total_taxable or 0),
                "gst_amount": float(invoice.total_gst or 0),
                "portal_gst_amount": float(invoice.total_gst or 0),
                "status": "matched" if float(invoice.total_gst or 0) > 0 else "pending"
            })

        return Response(records)


# class GSTReconciliationViewSet(viewsets.ModelViewSet):
#     queryset = GSTReconciliation.objects.all().order_by('-id')
#     serializer_class = GSTReconciliationSerializer