"""
Tests for the Journal Entry app.

Covers: balance validation, posting logic, account balance updates,
immutability of posted entries, and trial balance integrity.
"""

from decimal import Decimal
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from apps.accounts.models import Account
from .models import JournalEntry, EntryLine

User = get_user_model()


class JournalTestBase(APITestCase):
    """Base test case with common setup for all journal tests."""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='testpass123'
        )
        self.user = User.objects.create_user(
            username='accountant', email='acc@test.com', password='testpass123'
        )
        # Asset accounts (normal debit balance)
        self.cash = Account.objects.create(
            code='1010', name='Cash', account_type='A', balance=Decimal('100000')
        )
        self.receivable = Account.objects.create(
            code='1200', name='Accounts Receivable', account_type='A', balance=Decimal('0')
        )
        # Liability account (normal credit balance)
        self.payable = Account.objects.create(
            code='2100', name='Accounts Payable', account_type='L', balance=Decimal('0')
        )
        # Revenue account (normal credit balance)
        self.revenue = Account.objects.create(
            code='4100', name='Sales Revenue', account_type='R', balance=Decimal('0')
        )
        # Expense account (normal debit balance)
        self.cogs = Account.objects.create(
            code='5100', name='COGS', account_type='X', balance=Decimal('0')
        )

    def auth(self, admin=False):
        self.client.force_authenticate(user=self.admin if admin else self.user)

    def create_balanced_entry(self, debit_account, credit_account, amount,
                               description='Test', post=False):
        """Helper: create a balanced journal entry via the API."""
        self.auth()
        payload = {
            'date': '2025-06-01',
            'description': description,
            'reference': 'TEST-001',
            'lines': [
                {'account': debit_account.id, 'debit': str(amount), 'credit': '0.00'},
                {'account': credit_account.id, 'debit': '0.00', 'credit': str(amount)},
            ],
        }
        response = self.client.post(reverse('journal:journal-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        entry_id = response.data['id']

        if post:
            self.auth(admin=True)
            post_url = reverse('journal:journal-post-entry', args=[entry_id])
            r = self.client.post(post_url)
            self.assertEqual(r.status_code, status.HTTP_200_OK, r.data)

        return entry_id


class BalancedEntryTest(JournalTestBase):
    """Test balanced vs unbalanced entry creation."""

    def test_balanced_entry_saves_successfully(self):
        """A balanced entry (debits == credits) must return 201."""
        self.auth()
        payload = {
            'date': '2025-06-01',
            'description': 'Cash sale',
            'reference': 'INV-001',
            'lines': [
                {'account': self.cash.id, 'debit': '5000000.00', 'credit': '0.00', 'memo': 'Cash received'},
                {'account': self.revenue.id, 'debit': '0.00', 'credit': '5000000.00', 'memo': 'Sales'},
            ],
        }
        response = self.client.post(reverse('journal:journal-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('id', response.data)
        self.assertFalse(response.data['is_posted'])

    def test_unbalanced_entry_raises_validation_error(self):
        """An unbalanced entry must return 400 with descriptive error."""
        self.auth()
        payload = {
            'date': '2025-06-01',
            'description': 'Unbalanced entry',
            'lines': [
                {'account': self.cash.id, 'debit': '5000000.00', 'credit': '0.00'},
                {'account': self.revenue.id, 'debit': '0.00', 'credit': '4500000.00'},
            ],
        }
        response = self.client.post(reverse('journal:journal-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check error structure
        error_data = response.data
        self.assertIn('non_field_errors', error_data)

    def test_single_line_entry_rejected(self):
        """An entry with only 1 line must be rejected."""
        self.auth()
        payload = {
            'date': '2025-06-01',
            'description': 'Single line',
            'lines': [
                {'account': self.cash.id, 'debit': '1000.00', 'credit': '0.00'},
            ],
        }
        response = self.client.post(reverse('journal:journal-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_amounts_rejected(self):
        """Lines with negative debit/credit must be rejected."""
        self.auth()
        payload = {
            'date': '2025-06-01',
            'description': 'Negative amounts',
            'lines': [
                {'account': self.cash.id, 'debit': '-1000.00', 'credit': '0.00'},
                {'account': self.revenue.id, 'debit': '0.00', 'credit': '-1000.00'},
            ],
        }
        response = self.client.post(reverse('journal:journal-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_both_debit_and_credit_rejected(self):
        """A line with both debit and credit set must be rejected."""
        self.auth()
        payload = {
            'date': '2025-06-01',
            'description': 'Both dr+cr',
            'lines': [
                {'account': self.cash.id, 'debit': '1000.00', 'credit': '1000.00'},
                {'account': self.revenue.id, 'debit': '0.00', 'credit': '0.00'},
            ],
        }
        response = self.client.post(reverse('journal:journal-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class PostingTest(JournalTestBase):
    """Test posting business logic and account balance updates."""

    def test_posting_entry_updates_account_balances(self):
        """
        Posting a Cash DR / Revenue CR entry must:
        - Increase Cash (Asset → debit normal) balance by debit amount
        - Increase Revenue (Revenue → credit normal) balance by credit amount
        """
        amount = Decimal('5000000.00')
        initial_cash = self.cash.balance
        initial_rev = self.revenue.balance

        entry_id = self.create_balanced_entry(self.cash, self.revenue, amount, post=True)

        self.cash.refresh_from_db()
        self.revenue.refresh_from_db()

        self.assertEqual(self.cash.balance, initial_cash + amount,
                         "Asset account should increase on debit")
        self.assertEqual(self.revenue.balance, initial_rev + amount,
                         "Revenue account should increase on credit")

    def test_posting_entry_updates_liability_balance(self):
        """
        Posting a Cash DR / Payable CR entry:
        - Cash (Asset) increases by debit
        - Payable (Liability) increases by credit
        """
        amount = Decimal('2000000.00')
        initial_cash = self.cash.balance
        initial_payable = self.payable.balance

        entry_id = self.create_balanced_entry(self.cash, self.payable, amount, post=True)

        self.cash.refresh_from_db()
        self.payable.refresh_from_db()

        self.assertEqual(self.cash.balance, initial_cash + amount)
        self.assertEqual(self.payable.balance, initial_payable + amount)

    def test_already_posted_entry_returns_409(self):
        """Posting an already-posted entry must return 409 Conflict."""
        entry_id = self.create_balanced_entry(
            self.cash, self.revenue, Decimal('1000000'), post=True
        )
        self.auth(admin=True)
        url = reverse('journal:journal-post-entry', args=[entry_id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)


class ImmutabilityTest(JournalTestBase):
    """Test that posted entries cannot be modified via API."""

    def test_cannot_edit_posted_entry(self):
        """PUT on a posted entry must return 400."""
        entry_id = self.create_balanced_entry(
            self.cash, self.revenue, Decimal('1000000'), post=True
        )
        self.auth()
        url = reverse('journal:journal-detail', args=[entry_id])
        payload = {
            'date': '2025-07-01',
            'description': 'Modified description',
            'lines': [
                {'account': self.cash.id, 'debit': '1000000.00', 'credit': '0.00'},
                {'account': self.revenue.id, 'debit': '0.00', 'credit': '1000000.00'},
            ],
        }
        response = self.client.put(url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cannot_delete_posted_entry(self):
        """DELETE on a posted entry must return 400."""
        entry_id = self.create_balanced_entry(
            self.cash, self.revenue, Decimal('1000000'), post=True
        )
        self.auth(admin=True)
        url = reverse('journal:journal-detail', args=[entry_id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UnpostingTest(JournalTestBase):
    """Test unpost functionality reverses account balances."""

    def test_unposting_reverses_account_balances(self):
        """After unpost, account balances must return to pre-posting values."""
        amount = Decimal('3000000.00')
        initial_cash = self.cash.balance
        initial_rev = self.revenue.balance

        entry_id = self.create_balanced_entry(self.cash, self.revenue, amount, post=True)

        self.cash.refresh_from_db()
        self.revenue.refresh_from_db()
        self.assertEqual(self.cash.balance, initial_cash + amount)

        # Unpost
        self.auth(admin=True)
        url = reverse('journal:journal-unpost-entry', args=[entry_id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.cash.refresh_from_db()
        self.revenue.refresh_from_db()
        self.assertEqual(self.cash.balance, initial_cash, "Cash balance not reversed after unpost")
        self.assertEqual(self.revenue.balance, initial_rev, "Revenue balance not reversed after unpost")

    def test_only_admin_can_unpost(self):
        """Regular users must receive 403 on unpost."""
        entry_id = self.create_balanced_entry(
            self.cash, self.revenue, Decimal('1000000'), post=True
        )
        self.auth(admin=False)
        url = reverse('journal:journal-unpost-entry', args=[entry_id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class TrialBalanceTest(JournalTestBase):
    """Test that trial balance grand totals are equal after posting."""

    def test_trial_balance_sums_are_equal(self):
        """After posting entries, total debits must equal total credits in trial balance."""
        # Post a balanced entry
        self.create_balanced_entry(
            self.cash, self.revenue, Decimal('5000000'), post=True
        )
        self.create_balanced_entry(
            self.cogs, self.cash, Decimal('2000000'), post=True
        )

        self.auth()
        url = reverse('reports:trial-balance')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        grand = response.data.get('grand_totals', {})
        self.assertEqual(
            grand.get('total_debits'),
            grand.get('total_credits'),
            "Trial balance grand totals are not equal — double-entry violated!"
        )
