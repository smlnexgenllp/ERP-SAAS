# apps/production/services.py

from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from django.db.models import Q

from .models import ManufacturingOrder, WorkOrder
from apps.inventory.models import Machine


def to_decimal(value):
    try:
        return Decimal(str(value or 0))
    except:
        return Decimal('0')


class ProductionService:

    @staticmethod
    def get_ready_manufacturing_orders():
        """Return Manufacturing Orders that are ready to be converted into Work Orders"""
        return ManufacturingOrder.objects.filter(
            status='done'                    # Changed from 'draft' to 'done'
        ).select_related('product', 'planned_order')

    @staticmethod
    def is_machine_available(machine, start_date, end_date):
        """Check if machine is free between given dates (no overlap with active orders)"""
        if not start_date or not end_date:
            return True

        conflicting_orders = WorkOrder.objects.filter(
            machine=machine,
            status__in=['in_progress', 'scheduled']
        ).filter(
            Q(start_date__lte=end_date) & Q(finish_date__gte=start_date)
        )

        return not conflicting_orders.exists()

    @staticmethod
    def get_machine_busy_info(machine, proposed_start, proposed_end):
        """Return info about the conflicting Work Order"""
        conflicting = WorkOrder.objects.filter(
            machine=machine,
            status__in=['in_progress', 'scheduled']
        ).filter(
            Q(start_date__lte=proposed_end) & Q(finish_date__gte=proposed_start)
        ).order_by('start_date').first()

        if conflicting:
            return {
                'is_busy': True,
                'current_work_order_id': conflicting.id,
                'running_end_date': conflicting.finish_date,
                'running_start_date': conflicting.start_date,
                'status': conflicting.status,
            }
        return {'is_busy': False}

    @staticmethod
    def assign_machines_and_create_workorders(manufacturing_order_id=None, machine_id=None):
        """
        Create Work Orders from Manufacturing Orders where status = 'done'
        """
        if manufacturing_order_id:
            ready_orders = ManufacturingOrder.objects.filter(
                id=manufacturing_order_id, 
                status='done'                    # Changed to 'done'
            )
        else:
            ready_orders = ProductionService.get_ready_manufacturing_orders()

        if not ready_orders.exists():
            return 0, "No Manufacturing Orders with status 'done' found."

        # Get available machines
        if machine_id:
            available_machines = Machine.objects.filter(
                id=machine_id, 
                maintenance_status='operational', 
                is_active=True
            )
            if not available_machines.exists():
                return 0, "Selected machine is not operational or inactive."
        else:
            available_machines = Machine.objects.filter(
                maintenance_status='operational', 
                is_active=True
            ).order_by('name')

        if not available_machines.exists():
            return 0, "No operational machines available!"

        created_count = 0
        errors = []

        for mo in ready_orders:
            start_date = mo.start_date or timezone.now().date()

            # Calculate estimated finish date
            run_time_per_unit = to_decimal(getattr(mo.product, 'run_time_per_unit_hours', Decimal('0.05')))
            quantity = to_decimal(mo.quantity)

            temp_machine = available_machines.first()
            total_hours = temp_machine.calculate_lead_time(
                quantity=quantity, 
                run_time_per_unit=run_time_per_unit
            )
            effective_capacity = float(temp_machine.get_effective_capacity(days=1) or 8)
            total_hours_float = float(total_hours)
            days_needed = int((total_hours_float / effective_capacity) + 2)   # +2 days buffer

            finish_date = start_date + timedelta(days=days_needed)

            # === Specific Machine Assignment ===
            if machine_id:
                machine = available_machines.first()
                if not ProductionService.is_machine_available(machine, start_date, finish_date):
                    busy_info = ProductionService.get_machine_busy_info(machine, start_date, finish_date)
                    end_date_str = busy_info['running_end_date'].strftime('%Y-%m-%d') if busy_info.get('running_end_date') else 'N/A'
                    errors.append(f"Machine {machine.name} is busy. Current work order ends on {end_date_str}.")
                    continue

                # Create Work Order
                WorkOrder.objects.create(
                    manufacturing_order=mo,
                    machine=machine,
                    quantity=mo.quantity,
                    status='in_progress',
                    start_date=start_date,
                    finish_date=finish_date,
                )
                mo.status = 'in_progress'      # Update MO status
                mo.start_date = start_date
                mo.finish_date = finish_date
                mo.save()
                created_count += 1
                continue

            # === Auto-assign to best available machine ===
            free_machines = [
                m for m in available_machines 
                if ProductionService.is_machine_available(m, start_date, finish_date)
            ]

            if not free_machines:
                errors.append(f"No free machine found for Manufacturing Order #{mo.id}")
                continue

            machine = ProductionService._get_best_machine(mo, free_machines)
            if not machine:
                errors.append(f"Could not select best machine for MO #{mo.id}")
                continue

            # Create Work Order
            WorkOrder.objects.create(
                manufacturing_order=mo,
                machine=machine,
                quantity=mo.quantity,
                status='in_progress',
                start_date=start_date,
                finish_date=finish_date,
            )

            # Update Manufacturing Order
            mo.status = 'in_progress'
            mo.start_date = start_date
            mo.finish_date = finish_date
            mo.save()

            created_count += 1

        # Final response
        if created_count == 0:
            error_msg = errors[0] if errors else "Could not create any Work Orders."
            return 0, error_msg

        success_msg = f"Successfully created {created_count} Work Order(s) from 'done' Manufacturing Orders!"
        if errors:
            success_msg += f" ({len(errors)} failed)"

        return created_count, success_msg

    @staticmethod
    def _get_best_machine(manufacturing_order, machines):
        """Simple logic to pick best machine - can be enhanced later"""
        if not machines:
            return None
        # For now: pick the first one (you can improve this logic later)
        return machines[0]