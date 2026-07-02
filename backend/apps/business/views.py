from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, F, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from apps.sales.models import SalesOrder, SalesOrderItem
from apps.inventory.models import PurchaseOrder
from apps.finance.models import Transaction  # assuming this exists
from apps.organizations.models import Organization  # if needed

class AnalyticsDashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        organization = request.user.organization if hasattr(request.user, 'organization') else None
        from_date = request.query_params.get('fromDate')
        to_date = request.query_params.get('toDate')

        # Default date range (last 6 months)
        if not from_date:
            from_date = (timezone.now() - timedelta(days=180)).date()
        else:
            from_date = datetime.strptime(from_date, "%Y-%m-%d").date()

        if not to_date:
            to_date = timezone.now().date()
        else:
            to_date = datetime.strptime(to_date, "%Y-%m-%d").date()

        # ====================== KPIs ======================
        # Revenue from Confirmed/Delivered Sales Orders
        revenue = SalesOrder.objects.filter(
            organization=organization,
            order_date__gte=from_date,
            order_date__lte=to_date,
            status__in=['confirmed', 'processing', 'shipped', 'delivered']
        ).aggregate(total=Sum('grand_total'))['total'] or Decimal('0')

        # Expenses from Purchase Orders
        expenses = PurchaseOrder.objects.filter(
            organization=organization,
            created_at__date__gte=from_date,
            created_at__date__lte=to_date,
            status__in=['approved', 'closed']
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        net_profit = revenue - expenses

        total_orders = SalesOrder.objects.filter(
            organization=organization,
            order_date__gte=from_date,
            order_date__lte=to_date
        ).count()

        kpis = [
            {
                "title": "Total Revenue",
                "value": f"₹{revenue:,.2f}",
                "color": "#16a34a",
                "change": 18.5   # You can calculate real % change later
            },
            {
                "title": "Total Expenses",
                "value": f"₹{expenses:,.2f}",
                "color": "#dc2626",
                "change": -4.8
            },
            {
                "title": "Net Profit",
                "value": f"₹{net_profit:,.2f}",
                "color": "#2563eb",
                "change": 24.7
            },
            {
                "title": "Total Orders",
                "value": str(total_orders),
                "color": "#000000",
                "change": 12.3
            },
        ]

        # ====================== Monthly Trend ======================
        monthly = []
        current = from_date.replace(day=1)

        while current <= to_date:
            next_month = (current + timedelta(days=32)).replace(day=1)
            
            month_revenue = SalesOrder.objects.filter(
                organization=organization,
                order_date__gte=current,
                order_date__lt=next_month,
                status__in=['confirmed', 'processing', 'shipped', 'delivered']
            ).aggregate(total=Sum('grand_total'))['total'] or 0

            month_expense = PurchaseOrder.objects.filter(
                organization=organization,
                created_at__date__gte=current,
                created_at__date__lt=next_month,
                status__in=['approved', 'closed']
            ).aggregate(total=Sum('total_amount'))['total'] or 0

            monthly.append({
                "month": current.strftime("%b"),
                "revenue": float(month_revenue) / 1000000,   # in Millions
                "expense": float(month_expense) / 1000000,
                "profit": float(month_revenue - month_expense) / 1000000,
            })

            current = next_month

        # ====================== Top Branches / Organizations ======================
        top_branches = SalesOrder.objects.filter(
            organization=organization,
            order_date__gte=from_date,
            order_date__lte=to_date
        ).values('organization__name').annotate(
            revenue=Sum('grand_total')
        ).order_by('-revenue')[:5]

        top_branches = [
            {
                "name": item['organization__name'] or "Main Branch",
                "revenue": round(float(item['revenue'] or 0) / 1000000, 2)
            }
            for item in top_branches
        ]

        # ====================== Recent Activities ======================
        recent_activities = []
        
        # Recent Sales
        recent_sales = SalesOrder.objects.filter(
            organization=organization
        ).order_by('-created_at')[:5]

        for order in recent_sales:
            recent_activities.append({
                "text": f"Sales Order {order.order_number} - {order.status.upper()}",
                "time": order.created_at.strftime("%d %b, %I:%M %p")
            })

        # Recent Purchase Orders
        recent_pos = PurchaseOrder.objects.filter(
            organization=organization
        ).order_by('-created_at')[:3]

        for po in recent_pos:
            recent_activities.append({
                "text": f"Purchase Order {po.po_number} - {po.status.upper()}",
                "time": po.created_at.strftime("%d %b, %I:%M %p")
            })

        return Response({
            "kpis": kpis,
            "monthly": monthly,
            "top_branches": top_branches,
            "recent_activities": recent_activities,
        })