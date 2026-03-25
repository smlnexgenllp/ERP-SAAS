from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from .models import ManufacturingOrder, WorkOrder
from apps.inventory.models import Machine


def to_decimal(value):
    return Decimal(str(value or 0))


class ProductionService:

    @staticmethod
    def get_draft_manufacturing_orders():
        return ManufacturingOrder.objects.filter(
            status='draft'
        ).select_related('product', 'planned_order')

    @staticmethod
    def assign_machines_and_create_workorders(manufacturing_order_id=None, machine_id=None):
        """Assign machines and create work orders safely"""

        if manufacturing_order_id:
            draft_orders = ManufacturingOrder.objects.filter(
                id=manufacturing_order_id,
                status='draft'
            )
        else:
            draft_orders = ProductionService.get_draft_manufacturing_orders()

        if not draft_orders.exists():
            return 0, "No draft Manufacturing Orders found."

        # Machine selection
        if machine_id:
            available_machines = Machine.objects.filter(
                id=machine_id,
                maintenance_status='operational',
                is_active=True
            )
            if not available_machines.exists():
                return 0, "Selected machine is not available."
        else:
            available_machines = Machine.objects.filter(
                maintenance_status='operational',
                is_active=True
            ).order_by('name')

        if not available_machines.exists():
            return 0, "No operational machines available!"

        created_count = 0

        for mo in draft_orders:

            # Choose machine
            machine = (
                available_machines.first()
                if machine_id
                else ProductionService._get_best_machine(mo, available_machines)
            )

            if not machine:
                continue

            # Safe Decimal handling
            run_time_per_unit = getattr(
                mo.product,
                'run_time_per_unit_hours',
                Decimal('0.05')
            )
            run_time_per_unit = to_decimal(run_time_per_unit)

            quantity = to_decimal(mo.quantity)

            start_date = mo.start_date or timezone.now().date()

            # 🔥 Lead time calculation (FIXED)
            total_hours = machine.calculate_lead_time(
                quantity=quantity,
                run_time_per_unit=run_time_per_unit
            )

            # Convert for scheduling (safe float conversion ONLY here)
            effective_capacity = float(machine.get_effective_capacity(days=1) or 8)

            total_hours_float = float(total_hours)
            days_needed = int((total_hours_float / effective_capacity) + 2)

            finish_date = start_date + timedelta(days=days_needed)

            # Create Work Order
            WorkOrder.objects.create(
                manufacturing_order=mo,
                machine=machine,
                quantity=mo.quantity,
                status='in_progress',
                start_date=start_date,
                finish_date=finish_date,
            )

            # Update MO
            mo.status = 'in_progress'
            mo.start_date = start_date
            mo.finish_date = finish_date
            mo.save()

            created_count += 1

        return created_count, f"Successfully created {created_count} Work Order(s)!"

    @staticmethod
    def _get_best_machine(mo, machines):
        best_machine = None
        best_score = -1

        for machine in machines:
            if machine.is_available_for_scheduling(
                mo.start_date or timezone.now().date(),
                None
            ):
                score = float(machine.get_effective_capacity(days=1) or 0)

                if getattr(machine, 'work_center_type', None) == 'machine':
                    score += 20

                if score > best_score:
                    best_score = score
                    best_machine = machine

        return best_machine or machines.first()