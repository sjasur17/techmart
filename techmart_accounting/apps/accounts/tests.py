"""
Tests for the Chart of Accounts app.
"""

from decimal import Decimal
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

from .models import Account

User = get_user_model()


class AccountSetupMixin:
    """Mixin providing common setup for account tests."""

    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='admin', email='admin@test.com', password='testpass123'
        )
        self.user = User.objects.create_user(
            username='staff', email='staff@test.com', password='testpass123'
        )
        self.cash = Account.objects.create(
            code='1010', name='Cash and Bank', account_type='A', balance=Decimal('50000000')
        )
        self.revenue = Account.objects.create(
            code='4100', name='Sales Revenue', account_type='R', balance=Decimal('0')
        )
        self.liability = Account.objects.create(
            code='2100', name='Accounts Payable', account_type='L', balance=Decimal('8000000')
        )
        self.expense = Account.objects.create(
            code='5100', name='Cost of Goods Sold', account_type='X', balance=Decimal('0')
        )

    def auth_admin(self):
        self.client.force_authenticate(user=self.admin)

    def auth_user(self):
        self.client.force_authenticate(user=self.user)


class AccountTypeFilterTest(AccountSetupMixin, APITestCase):
    """Test account_type query filter."""

    def test_account_type_filter(self):
        """GET ?account_type=A must return only Asset accounts."""
        self.auth_user()
        url = reverse('accounts:account-list') + '?account_type=A'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data['results']
        self.assertTrue(len(results) > 0)
        for acc in results:
            self.assertEqual(acc['account_type'], 'A', "Non-asset account returned by type=A filter")

    def test_is_active_filter(self):
        """GET ?is_active=false must return only inactive accounts."""
        self.auth_user()
        self.cash.is_active = False
        self.cash.save()
        url = reverse('accounts:account-list') + '?is_active=false'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [a['id'] for a in response.data['results']]
        self.assertIn(self.cash.id, ids)
        self.assertNotIn(self.revenue.id, ids)


class AccountLedgerTest(AccountSetupMixin, APITestCase):
    """Test the account ledger endpoint."""

    def test_account_ledger_returns_correct_lines(self):
        """Ledger endpoint must return posted EntryLines for this account."""
        from django.utils import timezone
        from apps.journal.models import JournalEntry, EntryLine

        self.auth_user()
        entry = JournalEntry.objects.create(
            date='2025-01-01',
            description='Test entry',
            reference='REF-001',
            created_by=self.admin,
            is_posted=True,
            posted_at=timezone.now(),
        )
        line = EntryLine.objects.create(
            journal=entry,
            account=self.cash,
            debit=Decimal('100000'),
            credit=Decimal('0'),
        )
        # Also create a line for revenue to check isolation
        EntryLine.objects.create(
            journal=entry,
            account=self.revenue,
            debit=Decimal('0'),
            credit=Decimal('100000'),
        )

        url = reverse('accounts:account-ledger', args=[self.cash.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        result_ids = [r['id'] for r in response.data['results']]
        self.assertIn(line.id, result_ids)

    def test_ledger_excludes_unposted_entries(self):
        """Ledger must NOT show lines from unposted entries."""
        from apps.journal.models import JournalEntry, EntryLine

        self.auth_user()
        entry = JournalEntry.objects.create(
            date='2025-01-02',
            description='Unposted',
            reference='REF-002',
            created_by=self.admin,
            is_posted=False,
        )
        EntryLine.objects.create(
            journal=entry,
            account=self.cash,
            debit=Decimal('50000'),
            credit=Decimal('0'),
        )

        url = reverse('accounts:account-ledger', args=[self.cash.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # No results because entry is not posted
        self.assertEqual(response.data['count'], 0)


class AccountSoftDeleteTest(AccountSetupMixin, APITestCase):
    """Test soft delete behaviour."""

    def test_delete_sets_is_active_false(self):
        """DELETE must soft-delete account, leaving DB row intact."""
        self.auth_admin()
        url = reverse('accounts:account-detail', args=[self.cash.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.cash.refresh_from_db()
        self.assertFalse(self.cash.is_active)

    def test_non_admin_cannot_delete(self):
        """Regular users must receive 403 on DELETE."""
        self.auth_user()
        url = reverse('accounts:account-detail', args=[self.cash.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
