from .models import PurchaseReturn

def generate_debit_note_number():
    last = PurchaseReturn.objects.order_by('-id').first()

    if not last or not last.debit_note_number:
        next_num = 1
    else:
        last_num = int(last.debit_note_number.split('/')[-1])
        next_num = last_num + 1

    return f"DN/11/2026/{str(next_num).zfill(4)}"