"""
Tests for the Financial Reports app.
"""

from datetime import date, timedelta
from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from apps.accounts.models import Account
from apps.journal.models import JournalEntry, EntryLine

User = get_user_model()


class ReportsTestBase(APITestCase):
    """Base setup for report tests."""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='testpass123'
        )
        self.auth()
        
        # Accounts
        self.cash = Account.objects.create(code='1010', name='Cash', account_type='A', balance=Decimal('0'))
        self.revenue = Account.objects.create(code='4100', name='Sales', account_type='R', balance=Decimal('0'))
        self.expense = Account.objects.create(code='5100', name='COGS', account_type='X', balance=Decimal('0'))

    def auth(self):
        self.client.force_authenticate(user=self.admin)

    def post_balanced_entry(self, debit_acc, credit_acc, amount, date_str='2025-06-01'):
        """Helper to create and post an entry."""
        entry = JournalEntry.objects.create(
            date=date_str,
            description='Test entry',
            created_by=self.admin,
        )
        EntryLine.objects.create(journal=entry, account=debit_acc, debit=amount, credit=Decimal('0'))
        EntryLine.objects.create(journal=entry, account=credit_acc, debit=Decimal('0'), credit=amount)
        
        # Post it to update balances for real
        from django.db import transaction
        from django.utils import timezone
        with transaction.atomic():
            for line in entry.lines.all():
                if line.debit > 0:
                    line.account.apply_debit(line.debit)
                if line.credit > 0:
                    line.account.apply_credit(line.credit)
                line.account.save()
            entry.is_posted = True
            entry.posted_at = timezone.now()
            entry.save()
        return entry


class TrialBalanceReportTest(ReportsTestBase):

    def test_trial_balance_returns_all_accounts_and_balances(self):
        self.post_balanced_entry(self.cash, self.revenue, Decimal('5000'))
        
        url = reverse('reports:trial-balance')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertTrue(response.data['is_balanced'])
        grand_totals = response.data['grand_totals']
        self.assertEqual(Decimal(grand_totals['total_debits']), Decimal('5000.00'))
        self.assertEqual(Decimal(grand_totals['total_credits']), Decimal('5000.00'))


class IncomeStatementReportTest(ReportsTestBase):

    def test_income_statement_calculation(self):
        self.post_balanced_entry(self.cash, self.revenue, Decimal('10000'), date_str='2025-01-10')
        self.post_balanced_entry(self.expense, self.cash, Decimal('4000'), date_str='2025-01-15')
        
        url = reverse('reports:income-statement') + '?date_from=2025-01-01&date_to=2025-01-31'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(Decimal(response.data['total_revenue']), Decimal('10000.00'))
        self.assertEqual(Decimal(response.data['total_expenses']), Decimal('4000.00'))
        self.assertEqual(Decimal(response.data['net_income']), Decimal('6000.00'))


class BalanceSheetReportTest(ReportsTestBase):

    def test_balance_sheet_is_balanced(self):
        self.post_balanced_entry(self.cash, self.revenue, Decimal('10000'))
        
        url = reverse('reports:balance-sheet')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertTrue(response.data['is_balanced'])
        self.assertEqual(Decimal(response.data['total_assets']), Decimal('10000.00'))
        self.assertEqual(Decimal(response.data['total_liabilities_and_equity']), Decimal('10000.00'))


class CSVExportTests(ReportsTestBase):

    def test_trial_balance_export(self):
        url = reverse('reports:trial-balance-export')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('trial_balance', response['Content-Disposition'])

    def test_journal_entries_export(self):
        url = reverse('reports:journal-entries-export')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        self.assertIn('journal_entries', response['Content-Disposition'])


class DashboardReportTest(ReportsTestBase):

    def test_dashboard_uses_posted_entries_for_current_period_only(self):
        today = date.today()
        previous_month_date = (today.replace(day=1) - timedelta(days=1))

        # Included in default "month" filter
        self.post_balanced_entry(self.cash, self.revenue, Decimal('10000'), date_str=today.isoformat())
        self.post_balanced_entry(self.expense, self.cash, Decimal('4000'), date_str=today.isoformat())

        # Excluded from default "month" filter (previous month)
        self.post_balanced_entry(self.cash, self.revenue, Decimal('3000'), date_str=previous_month_date.isoformat())

        # Draft should never affect totals
        JournalEntry.objects.create(
            date=today,
            description='Draft transaction',
            created_by=self.admin,
            is_posted=False,
        )

        response = self.client.get(reverse('dashboard'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(Decimal(response.data['total_revenue']), Decimal('10000.00'))
        self.assertEqual(Decimal(response.data['total_expenses']), Decimal('4000.00'))
        self.assertEqual(Decimal(response.data['net_income']), Decimal('6000.00'))

        self.assertEqual(response.data['period'], 'month')
        self.assertEqual(response.data['posted_entries_count'], 2)
        self.assertEqual(response.data['draft_entries_count'], 1)
        self.assertEqual(len(response.data['monthly_trend']), 6)
        self.assertIn('month', response.data['monthly_trend'][0])
        self.assertIn('revenue', response.data['monthly_trend'][0])
        self.assertIn('expenses', response.data['monthly_trend'][0])
        self.assertIn('net_income', response.data['monthly_trend'][0])

        self.assertTrue(len(response.data['recent_entries']) > 0)
        self.assertIn('amount', response.data['recent_entries'][0])
        self.assertIn('status', response.data['recent_entries'][0])

    def test_dashboard_flags_balance_sheet_imbalance(self):
        Account.objects.create(code='1099', name='Unmapped Asset', account_type='A', balance=Decimal('500.00'))

        response = self.client.get(reverse('dashboard'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['balance_sheet_is_balanced'])
        self.assertEqual(
            Decimal(response.data['balance_sheet_out_of_balance_amount']),
            Decimal('500.00'),
        )
