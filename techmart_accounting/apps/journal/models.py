"""
Journal Entry and Entry Line models for TechMart Savdo Financial Accounting.

Implements double-entry bookkeeping rules:
  - Every JournalEntry must have at least 2 lines
  - Sum(debits) must equal Sum(credits) before posting
  - Account balances are updated atomically during posting
"""

from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Sum
from django.utils import timezone

User = get_user_model()


class JournalEntry(models.Model):
    """
    A double-entry journal entry grouping one or more EntryLines.

    Once posted (is_posted=True), the entry is immutable from the API layer
    and the associated account balances have been updated. Only admins may
    unpost an entry (which reverses all balance changes).
    """

    CURRENCIES = [
        ('UZS', 'Uzbek Som'),
        ('RUB', 'Russian Ruble'),
        ('USD', 'US Dollar'),
    ]

    date = models.DateField(
        help_text='Accounting date of the transaction (may differ from entry date).',
    )
    description = models.TextField(
        help_text='Narrative description of the transaction.',
    )
    reference = models.CharField(
        max_length=50,
        blank=True,
        help_text='External reference number, e.g. invoice or receipt number.',
    )
    currency = models.CharField(
        max_length=3,
        choices=CURRENCIES,
        default='UZS',
        help_text='Currency for this journal entry (UZS, RUB, USD).',
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='journal_entries',
        help_text='User who created this journal entry.',
    )
    is_posted = models.BooleanField(
        default=False,
        help_text='When True, this entry has been validated and account balances updated.',
    )
    posted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Timestamp when this entry was posted.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        verbose_name = 'Journal Entry'
        verbose_name_plural = 'Journal Entries'

    def __str__(self) -> str:
        status_label = 'POSTED' if self.is_posted else 'DRAFT'
        return f"[{status_label}] {self.date} — {self.description[:60]}"

    def is_balanced(self) -> bool:
        """
        Return True if the sum of all debit lines equals the sum of all credit lines.

        Uses DB aggregation for accuracy. Returns False if the entry has no lines.
        """
        totals = self.lines.aggregate(
            total_debit=Sum('debit'),
            total_credit=Sum('credit'),
        )
        total_debit = totals['total_debit'] or 0
        total_credit = totals['total_credit'] or 0
        return total_debit == total_credit

    def get_totals(self) -> dict:
        """
        Return a dict with total_debit, total_credit, and difference.

        Useful for validation error messaging.
        """
        totals = self.lines.aggregate(
            total_debit=Sum('debit'),
            total_credit=Sum('credit'),
        )
        total_debit = totals['total_debit'] or 0
        total_credit = totals['total_credit'] or 0
        return {
            'total_debit': total_debit,
            'total_credit': total_credit,
            'difference': abs(total_debit - total_credit),
        }

    def clean(self) -> None:
        """Validate balance constraint only when the entry has been saved with lines."""
        if self.pk and self.lines.exists() and not self.is_balanced():
            raise ValidationError(
                "Total debits must equal total credits for this journal entry."
            )


class EntryLine(models.Model):
    """
    A single debit or credit line within a JournalEntry.

    Business rules:
    - Either debit > 0 XOR credit > 0 (never both, never neither non-zero).
    - Both debit and credit cannot be negative.
    """

    journal = models.ForeignKey(
        JournalEntry,
        on_delete=models.CASCADE,
        related_name='lines',
        help_text='Parent journal entry.',
    )
    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.PROTECT,
        related_name='entry_lines',
        help_text='Account affected by this line.',
    )
    debit = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        help_text='Debit amount in UZS. Set to 0 if this is a credit line.',
    )
    credit = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        help_text='Credit amount in UZS. Set to 0 if this is a debit line.',
    )
    memo = models.CharField(
        max_length=200,
        blank=True,
        help_text='Optional line-level memo or note.',
    )

    class Meta:
        verbose_name = 'Entry Line'
        verbose_name_plural = 'Entry Lines'

    def __str__(self) -> str:
        if self.debit:
            return f"DR {self.account} {self.debit:,.2f}"
        return f"CR {self.account} {self.credit:,.2f}"

    def clean(self) -> None:
        """
        Enforce double-entry line-level constraints:
        1. No negative amounts.
        2. A line cannot have both a debit and credit amount.
        """
        from decimal import Decimal
        zero = Decimal('0.00')

        if self.debit < zero or self.credit < zero:
            raise ValidationError(
                "Debit and credit amounts cannot be negative."
            )
        if self.debit > zero and self.credit > zero:
            raise ValidationError(
                "An entry line cannot have both debit and credit amounts. "
                "Set one to zero."
            )
