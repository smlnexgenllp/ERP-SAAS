from apps.manufacturing.models import PlannedOrder, BillOfMaterial
from apps.sales.models import SalesOrderItem


def run_mrp(production_plan):

    sales_items = SalesOrderItem.objects.filter(
        sales_order=production_plan.sales_order
    )

    for item in sales_items:

        PlannedOrder.objects.create(
            production_plan=production_plan,
            product=item.product,
            quantity=item.quantity,
            planned_start=production_plan.planned_date,
            planned_finish=production_plan.planned_date
        )

    production_plan.status = "mrp_done"
    production_plan.save()

    return True