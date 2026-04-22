"""
Serializers for the Journal app.

Key feature: JournalEntrySerializer supports nested write — a single POST
request creates the JournalEntry and all its EntryLines atomically,
validating double-entry balance before saving.
"""

from decimal import Decimal
from rest_framework import serializers
from django.db import transaction

from .models import JournalEntry, EntryLine
from apps.accounts.models import Account
from apps.accounts.serializers import AccountSummarySerializer


class EntryLineWriteSerializer(serializers.ModelSerializer):
    """
    Serializer for writing EntryLine data (used inside nested create/update).
    Accepts account as a primary key (integer).
    """

    class Meta:
        model = EntryLine
        fields = ['id', 'account', 'debit', 'credit', 'memo']

    def validate_account(self, value: Account) -> Account:
        """Ensure the account exists and is active."""
        if not value.is_active:
            raise serializers.ValidationError(
                f"Account [{value.code}] {value.name} is inactive and cannot receive entries."
            )
        return value

    def validate(self, attrs: dict) -> dict:
        """Enforce line-level debit/credit constraints."""
        debit = attrs.get('debit', Decimal('0.00'))
        credit = attrs.get('credit', Decimal('0.00'))

        if debit < 0 or credit < 0:
            raise serializers.ValidationError(
                "Debit and credit amounts cannot be negative."
            )
        if debit > 0 and credit > 0:
            raise serializers.ValidationError(
                "An entry line cannot have both a debit and credit amount."
            )
        return attrs


class EntryLineDetailSerializer(serializers.ModelSerializer):
    """
    Read serializer for EntryLine — includes full account info for display.
    Used in journal detail views and account ledger endpoint.
    """

    account = AccountSummarySerializer(read_only=True)
    journal_date = serializers.DateField(source='journal.date', read_only=True)
    journal_reference = serializers.CharField(source='journal.reference', read_only=True)
    journal_description = serializers.CharField(source='journal.description', read_only=True)

    class Meta:
        model = EntryLine
        fields = [
            'id', 'journal', 'journal_date', 'journal_reference',
            'journal_description', 'account', 'debit', 'credit', 'memo',
        ]


class JournalEntrySerializer(serializers.ModelSerializer):
    """
    Full serializer for JournalEntry supporting nested EntryLine creation.

    On write, accepts a ``lines`` array; validates that debits == credits;
    creates the entry and all lines in one atomic DB transaction.
    On read, returns all line details with account information.
    """

    lines = EntryLineWriteSerializer(many=True)
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    created_by_name = serializers.StringRelatedField(source='created_by', read_only=True)
    is_balanced = serializers.SerializerMethodField(read_only=True)
    total_debit = serializers.SerializerMethodField(read_only=True)
    total_credit = serializers.SerializerMethodField(read_only=True)
    currency_display = serializers.CharField(
        source='get_currency_display', read_only=True
    )

    class Meta:
        model = JournalEntry
        fields = [
            'id', 'date', 'description', 'reference',
            'currency', 'currency_display',
            'created_by', 'created_by_name',
            'is_posted', 'posted_at',
            'is_balanced', 'total_debit', 'total_credit',
            'lines',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['is_posted', 'posted_at', 'created_at', 'updated_at']

    def get_is_balanced(self, obj: JournalEntry) -> bool:
        return obj.is_balanced()

    def get_total_debit(self, obj: JournalEntry) -> str:
        from django.db.models import Sum
        result = obj.lines.aggregate(total=Sum('debit'))['total'] or Decimal('0.00')
        return str(result)

    def get_total_credit(self, obj: JournalEntry) -> str:
        from django.db.models import Sum
        result = obj.lines.aggregate(total=Sum('credit'))['total'] or Decimal('0.00')
        return str(result)

    def validate_lines(self, lines_data: list) -> list:
        """Ensure at least 2 lines are provided."""
        if len(lines_data) < 2:
            raise serializers.ValidationError(
                "A journal entry must have at least 2 lines."
            )
        return lines_data

    def validate(self, attrs: dict) -> dict:
        """
        Validate double-entry balance constraint across all lines.

        Returns a detailed 400 error if debits != credits.
        """
        lines_data = attrs.get('lines', [])
        total_debit = sum(line.get('debit', Decimal('0')) for line in lines_data)
        total_credit = sum(line.get('credit', Decimal('0')) for line in lines_data)

        if total_debit != total_credit:
            raise serializers.ValidationError({
                'error': 'Journal entry is not balanced',
                'total_debit': str(total_debit),
                'total_credit': str(total_credit),
                'difference': str(abs(total_debit - total_credit)),
            })
        return attrs

    @transaction.atomic
    def create(self, validated_data: dict) -> JournalEntry:
        """
        Create a JournalEntry and all its lines in one atomic transaction.

        Uses bulk_create for efficiency when many lines are provided.
        """
        lines_data = validated_data.pop('lines')
        entry = JournalEntry.objects.create(**validated_data)

        EntryLine.objects.bulk_create([
            EntryLine(
                journal=entry,
                account=line['account'],
                debit=line.get('debit', Decimal('0.00')),
                credit=line.get('credit', Decimal('0.00')),
                memo=line.get('memo', ''),
            )
            for line in lines_data
        ])
        return entry

    @transaction.atomic
    def update(self, instance: JournalEntry, validated_data: dict) -> JournalEntry:
        """
        Update a draft journal entry, replacing all lines.

        Only allowed on unposted entries (enforced at view level).
        Deletes existing lines and recreates them for simplicity and
        to avoid stale-line orphan issues.
        """
        lines_data = validated_data.pop('lines', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if lines_data is not None:
            instance.lines.all().delete()
            EntryLine.objects.bulk_create([
                EntryLine(
                    journal=instance,
                    account=line['account'],
                    debit=line.get('debit', Decimal('0.00')),
                    credit=line.get('credit', Decimal('0.00')),
                    memo=line.get('memo', ''),
                )
                for line in lines_data
            ])
        return instance


class JournalEntryListSerializer(serializers.ModelSerializer):
    """
    Lightweight read serializer for list views — avoids heavy nested line data.
    """

    created_by_name = serializers.StringRelatedField(source='created_by')
    line_count = serializers.IntegerField(source='lines.count', read_only=True)

    class Meta:
        model = JournalEntry
        fields = [
            'id', 'date', 'description', 'reference',
            'created_by_name', 'is_posted', 'posted_at',
            'line_count', 'created_at',
        ]
