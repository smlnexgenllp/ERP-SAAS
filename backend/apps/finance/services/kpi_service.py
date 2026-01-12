from apps.finance.models.department_budget import DepartmentBudget

def department_kpi(monthly_budget):
    return DepartmentBudget.objects.filter(
        monthly_budget=monthly_budget
    ).values(
        "department",
        "allocated_amount",
        "used_amount"
    )
