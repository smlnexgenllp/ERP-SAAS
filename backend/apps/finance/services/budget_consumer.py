from django.db import transaction
from rest_framework.exceptions import ValidationError
from apps.finance.models.department_budget import DepartmentBudget

@transaction.atomic
def consume_department_budget(monthly_budget, department, amount):
    dept_budget = DepartmentBudget.objects.select_for_update().get(
        monthly_budget=monthly_budget,
        department=department
    )

    if dept_budget.remaining_amount < amount:
        raise ValidationError(
            f"{department} budget exceeded"
        )

    dept_budget.used_amount += amount
    dept_budget.save(update_fields=["used_amount"])

    return dept_budget
