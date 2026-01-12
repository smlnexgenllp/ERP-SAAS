from apps.finance.models.voucher import Voucher

def create_voucher(organization, amount, narration, user, voucher_type="PAYMENT"):
    return Voucher.objects.create(
        organization=organization,
        voucher_type=voucher_type,
        amount=amount,
        narration=narration,
        created_by=user
    )
