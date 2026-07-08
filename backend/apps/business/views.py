from decimal import Decimal

from django.db.models import Sum
from django.db.models.functions import Coalesce

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.finance.models.bank_reconciliation import BankAccount, BankTransaction
from apps.finance.models.gst_reconciliation import GSTReconciliation
from apps.finance.models.chart_of_accounts import ChartOfAccount
from apps.finance.models.party import Party
from apps.finance.models.transaction import Transaction
from apps.finance.models.budget import MonthlyBudget
from apps.finance.models.department_budget import DepartmentBudget
from apps.finance.models.vendor import Vendor
from apps.transport.models import (
    Vehicle,
    Driver,
    TransportTrip,
    FuelEntry,
    VehicleMaintenance,
    TransportExpense,
    TransportInvoice,
)
from apps.crm.models import (
    Contact,
    Opportunity,
    Customer,
    Quotation,
    Product,
)

from apps.sales.models import (
    SalesOrder,
    SalesInvoice,
)

from apps.inventory.models import (
    Dispatch,
    Item,
)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def business_dashboard(request):

    organization = request.GET.get("organization")
    from_date = request.GET.get("fromDate")
    to_date = request.GET.get("toDate")

    contacts = Contact.objects.all()
    opportunities = Opportunity.objects.all()
    customers = Customer.objects.all()
    quotations = Quotation.objects.all()
    sales_orders = SalesOrder.objects.all()
    dispatches = Dispatch.objects.all()
    invoices = SalesInvoice.objects.all()
    products = Product.objects.all()
    items = Item.objects.all()
    vendors = Vendor.objects.all()
    monthly_budgets = MonthlyBudget.objects.all()
    department_budgets = DepartmentBudget.objects.all()
    bank_accounts = BankAccount.objects.all()
    bank_transactions = BankTransaction.objects.all()
    gst_records = GSTReconciliation.objects.all()
    chart_accounts = ChartOfAccount.objects.all()
    ledger_transactions = Transaction.objects.all()
    parties = Party.objects.all()
    vehicles = Vehicle.objects.all()
    drivers = Driver.objects.all()
    trips = TransportTrip.objects.all()
    fuel_entries = FuelEntry.objects.all()
    maintenance = VehicleMaintenance.objects.all()
    transport_expenses = TransportExpense.objects.all()
    transport_invoices = TransportInvoice.objects.all()
    # ----------------------------
    # Organization Filter
    # ----------------------------

    if organization:

        contacts = contacts.filter(
            organization_id=organization
        )

        customers = customers.filter(
            organization_id=organization
        )

        opportunities = opportunities.filter(
            contact__organization_id=organization
        )

        quotations = quotations.filter(
            opportunity__contact__organization_id=organization
        )

        sales_orders = sales_orders.filter(
            organization_id=organization
        )

        dispatches = dispatches.filter(
            organization_id=organization
        )

        invoices = invoices.filter(
            organization_id=organization
        )

        products = products.filter(
            organization_id=organization
        )

        items = items.filter(
            organization_id=organization
        )
        vendors = vendors.filter(
            organization_id=organization
        )

        monthly_budgets = monthly_budgets.filter(
            organization_id=organization
        )
        

        bank_accounts = bank_accounts.filter(
            organization_id=organization
        )

        gst_records = gst_records.filter(
            organization_id=organization
        )

        chart_accounts = chart_accounts.filter(
            organization_id=organization
        )

        parties = parties.filter(
            organization_id=organization
        )
        department_budgets = department_budgets.filter(
            monthly_budget__organization_id=organization
        )
        department_budgets = department_budgets.filter(
            monthly_budget__organization_id=organization
        )
        ledger_transactions = ledger_transactions.filter(
            voucher__organization_id=organization
        )
        bank_transactions = bank_transactions.filter(
            bank_account__organization_id=organization
        )
        vehicles = vehicles.filter(organization_id=organization)
        drivers = drivers.filter(organization_id=organization)
        trips = trips.filter(organization_id=organization)
        fuel_entries = fuel_entries.filter(organization_id=organization)
        maintenance = maintenance.filter(organization_id=organization)
        transport_expenses = transport_expenses.filter(organization_id=organization)
        transport_invoices = transport_invoices.filter(organization_id=organization)
                
    # ----------------------------
    # Date Filter
    # ----------------------------

    if from_date and to_date:

        contacts = contacts.filter(
            created_at__date__range=[from_date, to_date]
        )

        customers = customers.filter(
            customer_since__range=[from_date, to_date]
        )

        opportunities = opportunities.filter(
            created_at__date__range=[from_date, to_date]
        )
        quotations = quotations.filter(
            date__range=[from_date, to_date]
        )

        sales_orders = sales_orders.filter(
            order_date__range=[from_date, to_date]
        )

        dispatches = dispatches.filter(
            dispatch_date__range=[from_date, to_date]
        )

        invoices = invoices.filter(
            invoice_date__range=[from_date, to_date]
        )

        products = products.filter(
            created_at__date__range=[from_date, to_date]
        )

        items = items.filter(
            created_at__date__range=[from_date, to_date]
        )
        monthly_budgets = monthly_budgets.filter(
            month__range=[from_date, to_date]
        )

        bank_transactions = bank_transactions.filter(
            transaction_date__range=[from_date, to_date]
        )

        gst_records = gst_records.filter(
            created_at__date__range=[from_date, to_date]
        )

        vendors = vendors.filter(
            created_at__date__range=[from_date, to_date]
        )
        trips = trips.filter(
            trip_date__range=[from_date, to_date]
        )

        fuel_entries = fuel_entries.filter(
            fuel_date__range=[from_date, to_date]
        )

        maintenance = maintenance.filter(
            service_date__range=[from_date, to_date]
        )

        transport_expenses = transport_expenses.filter(
            expense_date__range=[from_date, to_date]
        )

        transport_invoices = transport_invoices.filter(
            invoice_date__range=[from_date, to_date]
        )
    # ----------------------------
    # Dashboard Calculations
    # ----------------------------

    revenue = invoices.aggregate(
        total=Coalesce(Sum("grand_total"), Decimal("0"))
    )["total"]

    expense = items.aggregate(
        total=Coalesce(
            Sum("standard_price"),
            Decimal("0")
        )
    )["total"]

    inventory_value = sum(
        (item.current_stock or Decimal("0")) *
        (item.standard_price or Decimal("0"))
        for item in items
    )
    transport_revenue = transport_invoices.aggregate(
        total=Coalesce(
            Sum("grand_total"),
            Decimal("0")
        )
    )["total"]

    transport_expense = transport_expenses.aggregate(
        total=Coalesce(
            Sum("amount"),
            Decimal("0")
        )
    )["total"]

    fuel_cost = fuel_entries.aggregate(
        total=Coalesce(
            Sum("amount"),
            Decimal("0")
        )
    )["total"]

    maintenance_cost = maintenance.aggregate(
        total=Coalesce(
            Sum("cost"),
            Decimal("0")
        )
    )["total"]

    budget_amount = monthly_budgets.aggregate(
        total=Coalesce(
            Sum("amount"),
            Decimal("0")
        )
    )["total"]

    allocated_budget = department_budgets.aggregate(
        total=Coalesce(
            Sum("allocated_amount"),
            Decimal("0")
        )
    )["total"]

    used_budget = department_budgets.aggregate(
        total=Coalesce(
            Sum("used_amount"),
            Decimal("0")
        )
    )["total"]

    bank_balance = bank_accounts.aggregate(
        total=Coalesce(
            Sum("current_balance"),
            Decimal("0")
        )
    )["total"]

    debit_total = ledger_transactions.aggregate(
        total=Coalesce(
            Sum("debit"),
            Decimal("0")
        )
    )["total"]

    credit_total = ledger_transactions.aggregate(
        total=Coalesce(
            Sum("credit"),
            Decimal("0")
        )
    )["total"]
    total_revenue = revenue + transport_revenue

    total_expense = (
        expense
        + transport_expense
        + fuel_cost
        + maintenance_cost
    )

    profit = total_revenue - total_expense
    
    response = {

        # KPI Cards
        "revenue": total_revenue,
        "expense": total_expense,
        "profit": profit,
        "orders": sales_orders.count(),
        "customers": customers.count(),
        "quotations": quotations.count(),
        "products": products.count(),
        "inventory_value": inventory_value,

        # CRM
        "contacts": contacts.count(),
        "opportunities": opportunities.count(),
        "pipeline_value": opportunities.aggregate(
            total=Coalesce(
                Sum("value"),
                Decimal("0")
            )
        )["total"],

        "won_opportunities": opportunities.filter(
            stage="won"
        ).count(),

        "lost_opportunities": opportunities.filter(
            stage="lost"
        ).count(),

        # Sales
        "sales_orders": sales_orders.count(),

        "sales_order_value": sales_orders.aggregate(
            total=Coalesce(
                Sum("grand_total"),
                Decimal("0")
            )
        )["total"],

        "dispatches": dispatches.count(),

        "invoices": invoices.count(),

        "invoice_value": revenue,

        # Quotations
        "quotation_value": quotations.aggregate(
            total=Coalesce(
                Sum("grand_total"),
                Decimal("0")
            )
        )["total"],

        "pending_quotations": quotations.filter(
            status="draft"
        ).count(),

        "accepted_quotations": quotations.filter(
            status="accepted"
        ).count(),

        # Invoice Status
        "paid_invoices": invoices.filter(
            status="paid"
        ).count(),

        "pending_invoices": invoices.exclude(
            status="paid"
        ).count(),
        # ---------------- Finance ----------------

        "vendors": vendors.count(),

        "parties": parties.count(),

        "bank_accounts": bank_accounts.count(),

        "bank_balance": bank_balance,

        "monthly_budget": budget_amount,

        "allocated_budget": allocated_budget,

        "used_budget": used_budget,

        "remaining_budget": budget_amount - used_budget,

        "ledger_debit": debit_total,

        "ledger_credit": credit_total,

        "chart_accounts": chart_accounts.count(),

        "gst_records": gst_records.count(),

        "matched_gst": gst_records.filter(
            status="matched"
        ).count(),

        "mismatch_gst": gst_records.filter(
            status="mismatch"
        ).count(),

        "bank_transactions": bank_transactions.count(),
        # Transport

        "vehicles": vehicles.count(),

        "available_vehicles": vehicles.filter(
            status="available"
        ).count(),

        "vehicles_on_trip": vehicles.filter(
            status="on_trip"
        ).count(),

        "maintenance_vehicles": vehicles.filter(
            status="maintenance"
        ).count(),

        "drivers": drivers.count(),

        "active_drivers": drivers.filter(
            status="active"
        ).count(),

        "trips": trips.count(),

        "completed_trips": trips.filter(
            trip_status="completed"
        ).count(),

        "in_transit_trips": trips.filter(
            trip_status="in_transit"
        ).count(),

        "transport_revenue": transport_revenue,

        "transport_expense": transport_expense,

        "fuel_cost": fuel_cost,

        "maintenance_cost": maintenance_cost,
    }

    return Response(response)