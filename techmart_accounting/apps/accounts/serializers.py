"""
Serializers for the Chart of Accounts app.
"""

from rest_framework import serializers
from .models import Account


class AccountSerializer(serializers.ModelSerializer):
    """
    Full serializer for Account — used for list, create, and update operations.
    """

    account_type_display = serializers.CharField(
        source='get_account_type_display', read_only=True
    )
    currency_display = serializers.CharField(
        source='get_currency_display', read_only=True
    )

    class Meta:
        model = Account
        fields = [
            'id', 'code', 'name', 'account_type', 'account_type_display',
            'currency', 'currency_display', 'balance', 'is_active', 'created_at', 'updated_at',
        ]
        read_only_fields = ['balance', 'created_at', 'updated_at']

    def validate_code(self, value: str) -> str:
        """Ensure code is numeric-like and strip whitespace."""
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Account code cannot be blank.")
        return value

    def validate_name(self, value: str) -> str:
        return value.strip()


class AccountSummarySerializer(serializers.ModelSerializer):
    """
    Lightweight serializer used inside EntryLine responses to avoid deep nesting.
    """

    currency_display = serializers.CharField(
        source='get_currency_display', read_only=True
    )

    class Meta:
        model = Account
        fields = ['id', 'code', 'name', 'account_type', 'currency', 'currency_display']
