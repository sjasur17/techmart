"""
Chart of Accounts model for TechMart Savdo Financial Accounting.

Supports the standard accounting equation:
    Assets = Liabilities + Equity
    Revenue - Expenses = Net Income
"""

from django.db import models


class Account(models.Model):
    """
    Represents a single account in the Chart of Accounts.

    The double-entry balance is maintained via journal entry posting.
    Direct modification of ``balance`` outside of the posting workflow
    is discouraged; use management commands or fixtures for initial seeding.
    """

    TYPES = [
        ('A', 'Asset'),
        ('L', 'Liability'),
        ('E', 'Equity'),
        ('R', 'Revenue'),
        ('X', 'Expense'),
    ]

    # A/L/E accounts increase with credit; R increases with credit;
    # X (Expense) increases with debit.
    DEBIT_NORMAL = ('A', 'X')   # Debit increases balance
    CREDIT_NORMAL = ('L', 'E', 'R')  # Credit increases balance

    code = models.CharField(
        max_length=10,
        unique=True,
        help_text='Unique account code, e.g. 1010, 4100.',
    )
    name = models.CharField(
        max_length=100,
        help_text='Human-readable account name, e.g. "Cash and Bank".',
    )
    account_type = models.CharField(
        max_length=1,
        choices=TYPES,
        help_text='A=Asset, L=Liability, E=Equity, R=Revenue, X=Expense.',
    )
    balance = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0,
        help_text='Running balance in UZS. Updated atomically on journal entry posting.',
    )
    is_active = models.BooleanField(
        default=True,
        help_text='Inactive accounts cannot receive new journal entries.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Account'
        verbose_name_plural = 'Chart of Accounts'
        ordering = ['code']

    def __str__(self) -> str:
        return f"[{self.code}] {self.name}"

    def get_type_display_verbose(self) -> str:
        """Return the human-readable account type label."""
        return dict(self.TYPES).get(self.account_type, self.account_type)

    def apply_debit(self, amount) -> None:
        """
        Apply a debit amount to the account balance according to normal balance rules.

        - Asset / Expense accounts: debit increases balance.
        - Liability / Equity / Revenue accounts: debit decreases balance.
        """
        if self.account_type in self.DEBIT_NORMAL:
            self.balance += amount
        else:
            self.balance -= amount

    def apply_credit(self, amount) -> None:
        """
        Apply a credit amount to the account balance according to normal balance rules.

        - Liability / Equity / Revenue accounts: credit increases balance.
        - Asset / Expense accounts: credit decreases balance.
        """
        if self.account_type in self.CREDIT_NORMAL:
            self.balance += amount
        else:
            self.balance -= amount

    def reverse_debit(self, amount) -> None:
        """Reverse a previously-applied debit (used during unposting)."""
        if self.account_type in self.DEBIT_NORMAL:
            self.balance -= amount
        else:
            self.balance += amount

    def reverse_credit(self, amount) -> None:
        """Reverse a previously-applied credit (used during unposting)."""
        if self.account_type in self.CREDIT_NORMAL:
            self.balance -= amount
        else:
            self.balance += amount
