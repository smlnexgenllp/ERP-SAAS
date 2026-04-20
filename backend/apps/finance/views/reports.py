from decimal import Decimal
from django.db.models import F, DecimalField, Sum
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models.functions import Coalesce
from apps.sales.models import SalesInvoice
from apps.inventory.models import StockLedger, VendorInvoice
from apps.finance.models import Voucher
# Remove JournalEntry import if not available

from decimal import Decimal
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.sales.models import SalesInvoice
from apps.inventory.models import VendorInvoice


class ProfitLossReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.user.organization

        total_sales = SalesInvoice.objects.filter(
            organization=org
        ).aggregate(
            total=Sum('grand_total')
        )['total'] or Decimal('0')

        total_expenses = VendorInvoice.objects.filter(
            organization=org
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')

        net_profit = total_sales - total_expenses

        return Response({
            "sales": float(total_sales),
            "expenses": float(total_expenses),
            "net_profit": float(net_profit),
        })


from decimal import Decimal
from django.db.models import Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.sales.models import SalesInvoice
from apps.inventory.models import VendorInvoice
from apps.inventory.models import Item


class BalanceSheetView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = request.user.organization

        total_receivables = SalesInvoice.objects.filter(
            organization=org
        ).aggregate(
            total=Sum('grand_total')
        )['total'] or Decimal('0')

        total_payables = VendorInvoice.objects.filter(
            organization=org
        ).aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0')

        inventory_value = StockLedger.objects.filter(
            item__organization=org
        ).aggregate(
            total=Coalesce(
                Sum(
                    F('quantity') * F('item__standard_price'),
                    output_field=DecimalField()
                ),
                Decimal('0')
            )
        )['total']

        cash_balance = total_receivables - total_payables

        total_assets = total_receivables + inventory_value
        total_liabilities = total_payables
        total_equity = total_assets - total_liabilities

        return Response({
            "total_assets": float(total_assets),
            "total_liabilities": float(total_liabilities),
            "total_equity": float(total_equity),
            "cash_balance": float(cash_balance),
            "receivables": float(total_receivables),
            "payables": float(total_payables),
            "inventory_value": float(inventory_value),
        })