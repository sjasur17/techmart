import csv
from datetime import datetime, date
from decimal import Decimal
from django.db.models import Sum, Q, Value, Count
from django.db.models.functions import Coalesce, TruncMonth
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import Account
from apps.journal.models import JournalEntry, EntryLine
from .serializers import (
    TrialBalanceSerializer,
    IncomeStatementSerializer,
    BalanceSheetSerializer,
    DashboardSerializer
)


class TrialBalanceView(APIView):
    """
    GET /api/v1/reports/trial-balance/
    
    Returns a Trial Balance report including all active accounts with their
    calculated total debits, total credits, and resulting balances, only
    accounting for posted journal entries.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        # Get all active accounts annotated with sum of debits and credits from posted entries
        accounts_qs = Account.objects.filter(is_active=True).annotate(
            total_debits=Coalesce(
                Sum('entry_lines__debit', filter=Q(entry_lines__journal__is_posted=True)),
                Value(Decimal('0.00'))
            ),
            total_credits=Coalesce(
                Sum('entry_lines__credit', filter=Q(entry_lines__journal__is_posted=True)),
                Value(Decimal('0.00'))
            )
        ).order_by('code')

        accounts_data = []
        grand_total_debits = Decimal('0.00')
        grand_total_credits = Decimal('0.00')

        for acc in accounts_qs:
            # We also recalculate current balance to display. In a real system the Account.balance
            # field already has this (if properly maintained via atomic updates), but recalculating
            # ensures the report reflects exact sum of lines. Here we trust the balances for display
            # but also provide the line totals.
            acc_debit = acc.total_debits
            acc_credit = acc.total_credits
            grand_total_debits += acc_debit
            grand_total_credits += acc_credit

            accounts_data.append({
                'account_id': acc.id,
                'account_code': acc.code,
                'account_name': acc.name,
                'account_type': acc.account_type,
                'account_type_display': acc.get_type_display_verbose(),
                'total_debits': acc_debit,
                'total_credits': acc_credit,
                'balance': acc.balance,
            })

        data = {
            'generated_at': timezone.now(),
            'accounts': accounts_data,
            'grand_totals': {
                'total_debits': grand_total_debits,
                'total_credits': grand_total_credits,
            },
            'is_balanced': grand_total_debits == grand_total_credits,
        }

        serializer = TrialBalanceSerializer(data)
        return Response(serializer.data)


class IncomeStatementView(APIView):
    """
    GET /api/v1/reports/income-statement/
    
    Returns an Income Statement (P&L) within a given date range.
    Filters: ?date_from=YYYY-MM-DD & date_to=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        date_from_str = request.query_params.get('date_from')
        date_to_str = request.query_params.get('date_to')

        # Default filters to current year if not provided
        today = date.today()
        if date_from_str:
            date_from = datetime.strptime(date_from_str, '%Y-%m-%d').date()
        else:
            date_from = date(today.year, 1, 1)
            
        if date_to_str:
            date_to = datetime.strptime(date_to_str, '%Y-%m-%d').date()
        else:
            date_to = today

        # Base filter for posted entries in date range
        journal_filter = Q(entry_lines__journal__is_posted=True) & \
                         Q(entry_lines__journal__date__gte=date_from) & \
                         Q(entry_lines__journal__date__lte=date_to)

        # Revenue accounts
        revenue_qs = Account.objects.filter(account_type='R', is_active=True).annotate(
            period_debits=Coalesce(Sum('entry_lines__debit', filter=journal_filter), Value(Decimal('0.00'))),
            period_credits=Coalesce(Sum('entry_lines__credit', filter=journal_filter), Value(Decimal('0.00')))
        ).order_by('code')

        # Expense accounts
        expense_qs = Account.objects.filter(account_type='X', is_active=True).annotate(
            period_debits=Coalesce(Sum('entry_lines__debit', filter=journal_filter), Value(Decimal('0.00'))),
            period_credits=Coalesce(Sum('entry_lines__credit', filter=journal_filter), Value(Decimal('0.00')))
        ).order_by('code')

        revenues = []
        total_revenue = Decimal('0.00')
        for acc in revenue_qs:
            # Revenues increase with credit, decrease with debit
            amount = acc.period_credits - acc.period_debits
            total_revenue += amount
            revenues.append({
                'account_id': acc.id,
                'account_code': acc.code,
                'account_name': acc.name,
                'amount': amount,
            })

        expenses = []
        total_expenses = Decimal('0.00')
        for acc in expense_qs:
            # Expenses increase with debit, decrease with credit
            amount = acc.period_debits - acc.period_credits
            total_expenses += amount
            expenses.append({
                'account_id': acc.id,
                'account_code': acc.code,
                'account_name': acc.name,
                'amount': amount,
            })

        net_income = total_revenue - total_expenses

        data = {
            'date_from': date_from,
            'date_to': date_to,
            'generated_at': timezone.now(),
            'revenues': revenues,
            'expenses': expenses,
            'total_revenue': total_revenue,
            'total_expenses': total_expenses,
            'net_income': net_income,
        }

        serializer = IncomeStatementSerializer(data)
        return Response(serializer.data)


class BalanceSheetView(APIView):
    """
    GET /api/v1/reports/balance-sheet/
    
    Returns a Balance Sheet reporting Assets, Liabilities, and Equity based
    on the current state (balances) of the accounts.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        accounts = Account.objects.filter(is_active=True).order_by('code')
        
        assets = []
        liabilities = []
        equity = []
        
        total_assets = Decimal('0.00')
        total_liabilities = Decimal('0.00')
        total_equity = Decimal('0.00')

        for acc in accounts:
            item = {
                'account_id': acc.id,
                'account_code': acc.code,
                'account_name': acc.name,
                'balance': acc.balance,
            }
            if acc.account_type == 'A':
                assets.append(item)
                total_assets += acc.balance
            elif acc.account_type == 'L':
                liabilities.append(item)
                total_liabilities += acc.balance
            elif acc.account_type == 'E':
                equity.append(item)
                total_equity += acc.balance

        # To balance the sheet, we also need to consider retained earnings (Net Income)
        # We calculate total net income from R and X accounts
        rev_accounts = Account.objects.filter(account_type='R', is_active=True)
        exp_accounts = Account.objects.filter(account_type='X', is_active=True)
        total_rev = sum([acc.balance for acc in rev_accounts])
        total_exp = sum([acc.balance for acc in exp_accounts])
        net_income = total_rev - total_exp
        
        # Add net income to equity section implicitly for balance sheet presentation
        if net_income != Decimal('0.00'):
            equity.append({
                'account_id': -1,
                'account_code': 'RETAINED',
                'account_name': 'Retained Earnings (Net Income)',
                'balance': net_income
            })
            total_equity += net_income

        total_liabilities_and_equity = total_liabilities + total_equity

        data = {
            'generated_at': timezone.now(),
            'assets': assets,
            'liabilities': liabilities,
            'equity': equity,
            'total_assets': total_assets,
            'total_liabilities': total_liabilities,
            'total_equity': total_equity,
            'total_liabilities_and_equity': total_liabilities_and_equity,
            'is_balanced': total_assets == total_liabilities_and_equity,
        }

        serializer = BalanceSheetSerializer(data)
        return Response(serializer.data)


class DashboardView(APIView):
    """
    GET /api/v1/dashboard/
    
    Returns high-level summary metrics, such as total revenue, expenses, net income,
    assets and recent journal entries.
    """
    permission_classes = [IsAuthenticated]

    @staticmethod
    def _resolve_period_window(period: str) -> tuple[date, date]:
        """Return [date_from, date_to] window for month/year dashboard filters."""
        today = timezone.localdate()
        if period == 'year':
            return date(today.year, 1, 1), today
        return today.replace(day=1), today

    @staticmethod
    def _safe_percentage(numerator: Decimal, denominator: Decimal) -> Decimal:
        """Protect percentage math from division-by-zero errors."""
        if denominator == Decimal('0.00'):
            return Decimal('0.00')
        return (numerator / denominator) * Decimal('100.00')

    @staticmethod
    def _shift_month(month_start: date, offset: int) -> date:
        """Shift first-day-of-month date by offset months, preserving day=1."""
        month_index = month_start.month - 1 + offset
        year = month_start.year + (month_index // 12)
        month = (month_index % 12) + 1
        return date(year, month, 1)

    def _build_monthly_trend(self, posted_lines, months: int = 6) -> list[dict]:
        """Build last-N-month Revenue/Expenses/Net trend from posted journal lines."""
        current_month_start = timezone.localdate().replace(day=1)
        month_starts = [
            self._shift_month(current_month_start, -offset)
            for offset in range(months - 1, -1, -1)
        ]
        trend_start = month_starts[0]

        monthly_rows = (
            posted_lines
            .filter(journal__date__gte=trend_start)
            .annotate(month=TruncMonth('journal__date'))
            .values('month')
            .annotate(
                rev_credit=Coalesce(Sum('credit', filter=Q(account__account_type='R')), Value(Decimal('0.00'))),
                rev_debit=Coalesce(Sum('debit', filter=Q(account__account_type='R')), Value(Decimal('0.00'))),
                exp_debit=Coalesce(Sum('debit', filter=Q(account__account_type='X')), Value(Decimal('0.00'))),
                exp_credit=Coalesce(Sum('credit', filter=Q(account__account_type='X')), Value(Decimal('0.00'))),
            )
            .order_by('month')
        )

        monthly_map = {}
        for row in monthly_rows:
            month_key = row['month'].date() if hasattr(row['month'], 'date') else row['month']
            monthly_map[month_key] = row

        trend = []
        for month_start in month_starts:
            row = monthly_map.get(month_start)
            if row:
                revenue = row['rev_credit'] - row['rev_debit']
                expenses = row['exp_debit'] - row['exp_credit']
            else:
                revenue = Decimal('0.00')
                expenses = Decimal('0.00')

            trend.append({
                'month': month_start.strftime('%b %Y'),
                'revenue': revenue,
                'expenses': expenses,
                'net_income': revenue - expenses,
            })

        return trend

    def get(self, request: Request) -> Response:
        period = request.query_params.get('period', 'month').lower()
        if period not in ('month', 'year'):
            return Response(
                {'error': 'Invalid period. Use "month" or "year".'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        date_from, date_to = self._resolve_period_window(period)

        posted_lines = EntryLine.objects.filter(
            journal__is_posted=True,
            journal__date__gte=date_from,
            journal__date__lte=date_to,
        )

        revenue_totals = posted_lines.filter(account__account_type='R').aggregate(
            total_credit=Coalesce(Sum('credit'), Value(Decimal('0.00'))),
            total_debit=Coalesce(Sum('debit'), Value(Decimal('0.00'))),
        )
        expense_totals = posted_lines.filter(account__account_type='X').aggregate(
            total_debit=Coalesce(Sum('debit'), Value(Decimal('0.00'))),
            total_credit=Coalesce(Sum('credit'), Value(Decimal('0.00'))),
        )

        total_revenue = revenue_totals['total_credit'] - revenue_totals['total_debit']
        total_expenses = expense_totals['total_debit'] - expense_totals['total_credit']
        net_income = total_revenue - total_expenses

        net_margin_percent = self._safe_percentage(net_income, total_revenue)

        balance_totals = Account.objects.filter(is_active=True).aggregate(
            total_assets=Coalesce(Sum('balance', filter=Q(account_type='A')), Value(Decimal('0.00'))),
            total_liabilities=Coalesce(Sum('balance', filter=Q(account_type='L')), Value(Decimal('0.00'))),
            total_equity=Coalesce(Sum('balance', filter=Q(account_type='E')), Value(Decimal('0.00'))),
            revenue_balance=Coalesce(Sum('balance', filter=Q(account_type='R')), Value(Decimal('0.00'))),
            expense_balance=Coalesce(Sum('balance', filter=Q(account_type='X')), Value(Decimal('0.00'))),
        )

        total_assets = balance_totals['total_assets']
        total_liabilities = balance_totals['total_liabilities']
        total_equity = balance_totals['total_equity']
        retained_earnings = balance_totals['revenue_balance'] - balance_totals['expense_balance']
        total_liabilities_and_equity = total_liabilities + total_equity + retained_earnings
        balance_sheet_is_balanced = total_assets == total_liabilities_and_equity
        balance_sheet_out_of_balance_amount = abs(total_assets - total_liabilities_and_equity)

        posted_count = JournalEntry.objects.filter(
            is_posted=True,
            date__gte=date_from,
            date__lte=date_to,
        ).count()
        draft_count = JournalEntry.objects.filter(is_posted=False).count()

        recent_entries_qs = (
            JournalEntry.objects
            .select_related('created_by')
            .annotate(
                total_debit=Coalesce(Sum('lines__debit'), Value(Decimal('0.00'))),
                total_credit=Coalesce(Sum('lines__credit'), Value(Decimal('0.00'))),
                line_count=Count('lines'),
            )
            .order_by('-date', '-created_at')[:8]
        )

        recent_entries = []
        for entry in recent_entries_qs:
            status_value = 'posted' if entry.is_posted else 'draft'
            amount = entry.total_debit if entry.total_debit >= entry.total_credit else entry.total_credit
            recent_entries.append({
                'id': entry.id,
                'date': entry.date,
                'description': entry.description,
                'reference': entry.reference,
                'created_by_name': str(entry.created_by),
                'status': status_value,
                'is_posted': entry.is_posted,
                'posted_at': entry.posted_at,
                'line_count': entry.line_count,
                'amount': amount,
                'created_at': entry.created_at,
            })

        monthly_trend = self._build_monthly_trend(posted_lines)

        data = {
            'period': period,
            'date_from': date_from,
            'date_to': date_to,
            'total_revenue': total_revenue,
            'total_expenses': total_expenses,
            'net_income': net_income,
            'net_margin_percent': net_margin_percent,
            'total_assets': total_assets,
            'total_liabilities': total_liabilities,
            'total_equity': total_equity,
            'balance_sheet_is_balanced': balance_sheet_is_balanced,
            'balance_sheet_out_of_balance_amount': balance_sheet_out_of_balance_amount,
            'monthly_trend': monthly_trend,
            'posted_entries_count': posted_count,
            'draft_entries_count': draft_count,
            'recent_entries': recent_entries,
        }
        
        serializer = DashboardSerializer(data)
        return Response(serializer.data)


class ExportTrialBalanceCSVView(APIView):
    """
    GET /api/v1/reports/trial-balance/export/
    
    Download the Trial Balance report as a CSV file.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> HttpResponse:
        accounts_qs = Account.objects.filter(is_active=True).annotate(
            total_debits=Coalesce(
                Sum('entry_lines__debit', filter=Q(entry_lines__journal__is_posted=True)),
                Value(Decimal('0.00'))
            ),
            total_credits=Coalesce(
                Sum('entry_lines__credit', filter=Q(entry_lines__journal__is_posted=True)),
                Value(Decimal('0.00'))
            )
        ).order_by('code')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="trial_balance_{timezone.now().date()}.csv"'

        writer = csv.writer(response)
        writer.writerow(['Code', 'Name', 'Type', 'Total Debits', 'Total Credits', 'Balance'])

        for acc in accounts_qs:
            writer.writerow([
                acc.code,
                acc.name,
                acc.get_type_display_verbose(),
                acc.total_debits,
                acc.total_credits,
                acc.balance
            ])

        return response


class ExportJournalEntriesCSVView(APIView):
    """
    GET /api/v1/reports/journal-entries/export/
    
    Download Journal Entries and their lines as a CSV file.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> HttpResponse:
        lines_qs = EntryLine.objects.select_related('journal', 'account').order_by('-journal__date', '-journal__created_at')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="journal_entries_{timezone.now().date()}.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'Journal ID', 'Date', 'Reference', 'Description', 'Status',
            'Account Code', 'Account Name', 'Debit', 'Credit', 'Memo'
        ])

        for line in lines_qs:
            status_str = 'POSTED' if line.journal.is_posted else 'DRAFT'
            writer.writerow([
                line.journal.id,
                line.journal.date,
                line.journal.reference,
                line.journal.description,
                status_str,
                line.account.code,
                line.account.name,
                line.debit,
                line.credit,
                line.memo
            ])

        return response

import os
from decouple import config as decouple_config
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

class AIAssistantView(APIView):
    """
    POST /api/v1/reports/ai-assistant/
    
    Accepts a user query, gathers context from the financial state, and gets an answer from Claude.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user_message = request.data.get('message')
        if not user_message:
            return Response({'error': 'Message is required'}, status=400)

        # Gather quick context
        accounts = Account.objects.filter(is_active=True)
        total_revenue = sum([acc.balance for acc in accounts if acc.account_type == 'R'])
        total_expenses = sum([acc.balance for acc in accounts if acc.account_type == 'X'])
        total_assets = sum([acc.balance for acc in accounts if acc.account_type == 'A'])
        total_liabilities = sum([acc.balance for acc in accounts if acc.account_type == 'L'])
        total_equity = sum([acc.balance for acc in accounts if acc.account_type == 'E'])
        net_income = total_revenue - total_expenses
        
        context_str = f"""
        Current Financial Context:
        - Total Revenue: {total_revenue} UZS
        - Total Expenses: {total_expenses} UZS
        - Net Income: {net_income} UZS
        - Total Assets: {total_assets} UZS
        - Total Liabilities: {total_liabilities} UZS
        - Total Equity: {total_equity} UZS
        You are an expert financial AI assistant for TechMart Savdo. Answer concisely based on the context above.
        """

        try:
            import anthropic
            api_key = decouple_config('ANTHROPIC_API_KEY', default='')
            if not api_key:
                return Response({'error': 'Anthropic API key is not configured.'}, status=500)
                
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=300,
                system=context_str,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )
            return Response({'reply': response.content[0].text})
        except Exception as e:
            return Response({'error': str(e)}, status=500)


class HelpAIAssistantView(APIView):
    """
    POST /api/v1/reports/help-assistant/

    Claude-powered support assistant for troubleshooting system issues only.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        user_message = (request.data.get('message') or '').strip()
        if not user_message:
            return Response({'error': 'Message is required'}, status=400)

        system_prompt = """
        You are TechMart Savdo System Support AI.

        Scope (answer ONLY these):
        - Login/authentication/session/token issues
        - Permissions/role access issues
        - Account, journal, posting/unposting workflow issues
        - Reports/export/print issues
        - Dashboard, settings, language/theme, notifications
        - API/network/server validation error troubleshooting for this app

        Rules:
        - If the user asks anything outside TechMart system troubleshooting,
          reply exactly: "I can only help with TechMart system issues. Please describe your app problem."
        - Give practical troubleshooting guidance, not policy/legal advice.
        - Keep answers concise and actionable.
        - Prefer the user's language.

        Response format:
        1) Probable cause
        2) Step-by-step fix
        3) If unresolved, what logs/screenshots to share
        """

        try:
            import anthropic

            api_key = decouple_config('ANTHROPIC_API_KEY', default='')
            if not api_key:
                return Response({'error': 'Anthropic API key is not configured.'}, status=500)

            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=350,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message}
                ]
            )

            return Response({'reply': response.content[0].text})
        except Exception as e:
            return Response({'error': str(e)}, status=500)
