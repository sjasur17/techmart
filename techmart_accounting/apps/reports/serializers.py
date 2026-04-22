"""
Serializers for financial report responses.

These are non-model serializers used for structured report output.
"""

from rest_framework import serializers


class TrialBalanceLineSerializer(serializers.Serializer):
    """Represents one account row in the Trial Balance report."""

    account_id = serializers.IntegerField()
    account_code = serializers.CharField()
    account_name = serializers.CharField()
    account_type = serializers.CharField()
    account_type_display = serializers.CharField()
    total_debits = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_credits = serializers.DecimalField(max_digits=16, decimal_places=2)
    balance = serializers.DecimalField(max_digits=16, decimal_places=2)


class TrialBalanceSerializer(serializers.Serializer):
    """Full Trial Balance report response."""

    generated_at = serializers.DateTimeField()
    accounts = TrialBalanceLineSerializer(many=True)
    grand_totals = serializers.DictField()
    is_balanced = serializers.BooleanField()


class IncomeStatementLineSerializer(serializers.Serializer):
    """A single line in the income statement (revenue or expense)."""

    account_id = serializers.IntegerField()
    account_code = serializers.CharField()
    account_name = serializers.CharField()
    amount = serializers.DecimalField(max_digits=16, decimal_places=2)


class IncomeStatementSerializer(serializers.Serializer):
    """Full Income Statement report response."""

    date_from = serializers.DateField()
    date_to = serializers.DateField()
    generated_at = serializers.DateTimeField()
    revenues = IncomeStatementLineSerializer(many=True)
    expenses = IncomeStatementLineSerializer(many=True)
    total_revenue = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=16, decimal_places=2)
    net_income = serializers.DecimalField(max_digits=16, decimal_places=2)


class BalanceSheetSectionSerializer(serializers.Serializer):
    """A section (Assets, Liabilities, or Equity) in the balance sheet."""

    account_id = serializers.IntegerField()
    account_code = serializers.CharField()
    account_name = serializers.CharField()
    balance = serializers.DecimalField(max_digits=16, decimal_places=2)


class BalanceSheetSerializer(serializers.Serializer):
    """Full Balance Sheet report response."""

    generated_at = serializers.DateTimeField()
    assets = BalanceSheetSectionSerializer(many=True)
    liabilities = BalanceSheetSectionSerializer(many=True)
    equity = BalanceSheetSectionSerializer(many=True)
    total_assets = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_liabilities = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_equity = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_liabilities_and_equity = serializers.DecimalField(max_digits=16, decimal_places=2)
    is_balanced = serializers.BooleanField()


class DashboardSerializer(serializers.Serializer):
    """Dashboard summary response."""

    period = serializers.ChoiceField(choices=['month', 'year'])
    date_from = serializers.DateField()
    date_to = serializers.DateField()
    total_revenue = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=16, decimal_places=2)
    net_income = serializers.DecimalField(max_digits=16, decimal_places=2)
    net_margin_percent = serializers.DecimalField(max_digits=8, decimal_places=2)
    total_assets = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_liabilities = serializers.DecimalField(max_digits=16, decimal_places=2)
    total_equity = serializers.DecimalField(max_digits=16, decimal_places=2)
    balance_sheet_is_balanced = serializers.BooleanField()
    balance_sheet_out_of_balance_amount = serializers.DecimalField(max_digits=16, decimal_places=2)
    monthly_trend = serializers.ListField()
    posted_entries_count = serializers.IntegerField()
    draft_entries_count = serializers.IntegerField()
    recent_entries = serializers.ListField()
