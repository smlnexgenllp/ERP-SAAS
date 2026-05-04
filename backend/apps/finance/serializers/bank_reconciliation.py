from rest_framework import serializers
from apps.finance.models.bank_reconciliation import BankAccount, BankTransaction


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'


class BankTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankTransaction
        fields = '__all__'
        
        
        