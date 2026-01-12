from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from apps.finance.models import Voucher
from apps.finance.serializers.voucher import VoucherSerializer

class VoucherViewSet(ModelViewSet):
    serializer_class = VoucherSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Voucher.objects.all()
