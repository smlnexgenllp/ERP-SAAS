from rest_framework import serializers
from django.db import transaction
from apps.finance.models import Voucher, Transaction

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ("account", "debit", "credit")


class VoucherSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True)

    class Meta:
        model = Voucher
        fields = (
            "id",
            "voucher_type",
            "voucher_number",
            "date",
            "narration",
            "transactions",
        )

    def validate(self, data):
        txns = data.get("transactions", [])

        if len(txns) < 2:
            raise serializers.ValidationError(
                {"transactions": "Minimum two entries required"}
            )

        debit = sum(t["debit"] for t in txns)
        credit = sum(t["credit"] for t in txns)

        if debit != credit:
            raise serializers.ValidationError(
                "Debit and credit must match"
            )

        return data

    @transaction.atomic
    def create(self, validated_data):
        txns = validated_data.pop("transactions")

        user = self.context["request"].user

        voucher = Voucher.objects.create(
            organization=user.organization,  # 🔥 SAFE
            **validated_data
        )

        for txn in txns:
            Transaction.objects.create(
                voucher=voucher,
                **txn
            )

        return voucher
