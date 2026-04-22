import os
import sys
from decimal import Decimal

import django
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'techmart_accounting.settings.local')
sys.path.insert(0, BASE_DIR)
django.setup()

from apps.accounts.models import Account
from apps.journal.models import EntryLine, JournalEntry

User = get_user_model()

ADMIN_EMAIL = 'admin@techmart.uz'
ADMIN_USERNAME = 'admin_techmart'
ADMIN_PASSWORD = 'Admin123!Tech'

OPENING_ACCOUNTS = [
    {'code': '1010', 'name': 'Cash and Bank', 'account_type': 'A', 'balance': Decimal('180000000.00')},
    {'code': '1200', 'name': 'Accounts Receivable', 'account_type': 'A', 'balance': Decimal('25000000.00')},
    {'code': '1300', 'name': 'Inventory', 'account_type': 'A', 'balance': Decimal('42000000.00')},
    {'code': '1500', 'name': 'Equipment', 'account_type': 'A', 'balance': Decimal('120000000.00')},
    {'code': '2100', 'name': 'Accounts Payable', 'account_type': 'L', 'balance': Decimal('18000000.00')},
    {'code': '2200', 'name': 'VAT Payable', 'account_type': 'L', 'balance': Decimal('6000000.00')},
    {'code': '2300', 'name': 'Payroll Payable', 'account_type': 'L', 'balance': Decimal('4000000.00')},
    {'code': '2400', 'name': 'Taxes Payable', 'account_type': 'L', 'balance': Decimal('3000000.00')},
    {'code': '2500', 'name': 'Bank Loan', 'account_type': 'L', 'balance': Decimal('60000000.00')},
    {'code': '3000', 'name': 'Owner\'s Equity', 'account_type': 'E', 'balance': Decimal('276000000.00')},
    {'code': '4100', 'name': 'Sales Revenue', 'account_type': 'R', 'balance': Decimal('0.00')},
    {'code': '4200', 'name': 'Service Revenue', 'account_type': 'R', 'balance': Decimal('0.00')},
    {'code': '5100', 'name': 'Cost of Goods Sold', 'account_type': 'X', 'balance': Decimal('0.00')},
    {'code': '5200', 'name': 'Salaries Expense', 'account_type': 'X', 'balance': Decimal('0.00')},
    {'code': '5300', 'name': 'Rent Expense', 'account_type': 'X', 'balance': Decimal('0.00')},
    {'code': '5400', 'name': 'Utilities Expense', 'account_type': 'X', 'balance': Decimal('0.00')},
    {'code': '5500', 'name': 'Marketing Expense', 'account_type': 'X', 'balance': Decimal('0.00')},
    {'code': '5600', 'name': 'Bank Fees', 'account_type': 'X', 'balance': Decimal('0.00')},
    {'code': '5700', 'name': 'Tax Expense', 'account_type': 'X', 'balance': Decimal('0.00')},
]

DEMO_JOURNAL_ENTRIES = [
    {
        'date': '2025-11-05',
        'reference': 'TM-INV-251105',
        'description': 'Cash sale for retail hardware and accessories',
        'posted': True,
        'lines': [
            ('1010', '62000000.00', '0.00', 'Cash collection from point-of-sale sales'),
            ('4100', '0.00', '62000000.00', 'Retail hardware revenue'),
        ],
    },
    {
        'date': '2025-11-12',
        'reference': 'TM-BILL-251112',
        'description': 'Inventory purchased on supplier credit',
        'posted': True,
        'lines': [
            ('1300', '35000000.00', '0.00', 'New inventory stock for Q4 demand'),
            ('2100', '0.00', '35000000.00', 'Trade supplier invoice on credit'),
        ],
    },
    {
        'date': '2025-11-20',
        'reference': 'TM-PMT-251120',
        'description': 'Partial payment to inventory supplier',
        'posted': True,
        'lines': [
            ('2100', '12000000.00', '0.00', 'Supplier settlement for prior invoice'),
            ('1010', '0.00', '12000000.00', 'Bank transfer to supplier'),
        ],
    },
    {
        'date': '2025-12-03',
        'reference': 'TM-INV-251203',
        'description': 'Wholesale sale to channel partner on credit',
        'posted': True,
        'lines': [
            ('1200', '48000000.00', '0.00', 'Invoice issued to channel partner'),
            ('4100', '0.00', '48000000.00', 'Wholesale product revenue'),
        ],
    },
    {
        'date': '2025-12-11',
        'reference': 'TM-COGS-251211',
        'description': 'Cost of goods sold recognized for shipped inventory',
        'posted': True,
        'lines': [
            ('5100', '28000000.00', '0.00', 'COGS recognized on fulfilled order'),
            ('1300', '0.00', '28000000.00', 'Inventory relieved on shipment'),
        ],
    },
    {
        'date': '2025-12-18',
        'reference': 'TM-PAY-251218',
        'description': 'Monthly salaries paid to operations team',
        'posted': True,
        'lines': [
            ('5200', '14000000.00', '0.00', 'December payroll expense'),
            ('1010', '0.00', '14000000.00', 'Payroll bank payout'),
        ],
    },
    {
        'date': '2026-01-06',
        'reference': 'TM-AR-260106',
        'description': 'Customer receipt collected from outstanding receivables',
        'posted': True,
        'lines': [
            ('1010', '20000000.00', '0.00', 'Customer settlement via bank transfer'),
            ('1200', '0.00', '20000000.00', 'Accounts receivable cleared'),
        ],
    },
    {
        'date': '2026-01-10',
        'reference': 'TM-EXP-260110',
        'description': 'Office rent and utilities for headquarters',
        'posted': True,
        'lines': [
            ('5300', '9000000.00', '0.00', 'Office rent for January'),
            ('5400', '4000000.00', '0.00', 'Electricity and water charges'),
            ('1010', '0.00', '13000000.00', 'Combined facility payment'),
        ],
    },
    {
        'date': '2026-02-04',
        'reference': 'TM-LOAN-260204',
        'description': 'Working capital loan received from bank',
        'posted': True,
        'lines': [
            ('1010', '40000000.00', '0.00', 'Loan proceeds credited to bank'),
            ('2500', '0.00', '40000000.00', 'Short-term bank borrowing'),
        ],
    },
    {
        'date': '2026-02-14',
        'reference': 'TM-CAPEX-260214',
        'description': 'Warehouse equipment purchase and installation',
        'posted': True,
        'lines': [
            ('1500', '30000000.00', '0.00', 'New warehouse equipment'),
            ('1010', '0.00', '30000000.00', 'Capital expenditure payment'),
        ],
    },
    {
        'date': '2026-02-23',
        'reference': 'TM-MKT-260223',
        'description': 'Digital marketing campaign for spring demand',
        'posted': True,
        'lines': [
            ('5500', '8000000.00', '0.00', 'Ads and campaign production'),
            ('1010', '0.00', '8000000.00', 'Marketing payment'),
        ],
    },
    {
        'date': '2026-03-02',
        'reference': 'TM-TAX-260302',
        'description': 'VAT and tax accrual for February operations',
        'posted': True,
        'lines': [
            ('5700', '5000000.00', '0.00', 'Accrued corporate tax expense'),
            ('2200', '0.00', '5000000.00', 'VAT/tax liability accrued'),
        ],
    },
    {
        'date': '2026-03-15',
        'reference': 'TM-SVC-260315',
        'description': 'Service revenue for installation and support contract',
        'posted': True,
        'lines': [
            ('1010', '26000000.00', '0.00', 'Cash received for service contract'),
            ('4200', '0.00', '26000000.00', 'Service and support revenue'),
        ],
    },
    {
        'date': '2026-03-22',
        'reference': 'TM-PR-260322',
        'description': 'Payroll accrued for warehouse and finance staff',
        'posted': False,
        'lines': [
            ('5200', '11000000.00', '0.00', 'Accrued March payroll'),
            ('2300', '0.00', '11000000.00', 'Payroll payable accrued'),
        ],
    },
    {
        'date': '2026-04-02',
        'reference': 'TM-INV-260402',
        'description': 'Credit sale to reseller network for spring restock',
        'posted': True,
        'lines': [
            ('1200', '55000000.00', '0.00', 'Invoice issued to reseller'),
            ('4100', '0.00', '55000000.00', 'Product revenue on credit'),
        ],
    },
    {
        'date': '2026-04-10',
        'reference': 'TM-LOAN-260410',
        'description': 'Partial principal repayment on bank loan',
        'posted': True,
        'lines': [
            ('2500', '10000000.00', '0.00', 'Loan principal repayment'),
            ('1010', '0.00', '10000000.00', 'Bank transfer to lender'),
        ],
    },
    {
        'date': '2026-04-18',
        'reference': 'TM-FEE-260418',
        'description': 'Monthly bank service fees',
        'posted': True,
        'lines': [
            ('5600', '1200000.00', '0.00', 'Bank processing and service fees'),
            ('1010', '0.00', '1200000.00', 'Bank fee deduction'),
        ],
    },
]


def parse_amount(value: str) -> Decimal:
    return Decimal(value).quantize(Decimal('0.01'))


class Command(BaseCommand):
    help = 'Reset and seed a realistic TechMart demo company dataset for the dashboard.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--keep-existing',
            action='store_true',
            help='Keep existing journals/accounts and only add missing demo records.',
        )

    def handle(self, *args, **options):
        keep_existing = options.get('keep_existing', False)

        self.stdout.write('Starting TechMart demo seed...')

        user, created = User.objects.get_or_create(
            email=ADMIN_EMAIL,
            defaults={
                'username': ADMIN_USERNAME,
                'first_name': 'TechMart',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
                'is_accountant': True,
            },
        )

        if created:
            user.set_password(ADMIN_PASSWORD)
            user.save(update_fields=['password'])
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {ADMIN_EMAIL}'))
        else:
            updated_fields = []
            if not user.check_password(ADMIN_PASSWORD):
                user.set_password(ADMIN_PASSWORD)
                updated_fields.append('password')
            if user.username != ADMIN_USERNAME:
                user.username = ADMIN_USERNAME
                updated_fields.append('username')
            if user.first_name != 'TechMart':
                user.first_name = 'TechMart'
                updated_fields.append('first_name')
            if user.last_name != 'Admin':
                user.last_name = 'Admin'
                updated_fields.append('last_name')
            if not user.is_staff:
                user.is_staff = True
                updated_fields.append('is_staff')
            if not user.is_superuser:
                user.is_superuser = True
                updated_fields.append('is_superuser')
            if not user.is_accountant:
                user.is_accountant = True
                updated_fields.append('is_accountant')
            if updated_fields:
                user.save(update_fields=updated_fields)
            self.stdout.write(self.style.SUCCESS(f'Using admin user: {ADMIN_EMAIL}'))

        with transaction.atomic():
            if not keep_existing:
                EntryLine.objects.all().delete()
                JournalEntry.objects.all().delete()
                Account.objects.all().delete()
                self.stdout.write('Cleared existing journal and account data.')

            accounts_by_code = {}
            for account_data in OPENING_ACCOUNTS:
                account, _ = Account.objects.update_or_create(
                    code=account_data['code'],
                    defaults={
                        'name': account_data['name'],
                        'account_type': account_data['account_type'],
                        'balance': account_data['balance'],
                        'is_active': True,
                    },
                )
                accounts_by_code[account.code] = account

            self.stdout.write(self.style.SUCCESS(f'Seeded {len(accounts_by_code)} chart-of-account records.'))

            posted_count = 0
            draft_count = 0

            for entry_data in DEMO_JOURNAL_ENTRIES:
                entry, created_entry = JournalEntry.objects.get_or_create(
                    reference=entry_data['reference'],
                    defaults={
                        'date': entry_data['date'],
                        'description': entry_data['description'],
                        'created_by': user,
                        'is_posted': False,
                    },
                )

                if not created_entry:
                    self.stdout.write(f'Skipping existing entry {entry.reference}.')
                    continue

                for code, debit, credit, memo in entry_data['lines']:
                    EntryLine.objects.create(
                        journal=entry,
                        account=accounts_by_code[code],
                        debit=parse_amount(debit),
                        credit=parse_amount(credit),
                        memo=memo,
                    )

                if entry_data['posted']:
                    self._post_entry(entry)
                    posted_count += 1
                else:
                    draft_count += 1

            self.stdout.write(self.style.SUCCESS(f'Posted {posted_count} journal entries.'))
            self.stdout.write(self.style.SUCCESS(f'Created {draft_count} draft journal entries.'))

        self._print_summary()
        self.stdout.write(self.style.SUCCESS('Demo seed completed successfully.'))

    def _post_entry(self, entry: JournalEntry) -> None:
        with transaction.atomic():
            lines = EntryLine.objects.select_related('account').select_for_update().filter(journal=entry)
            for line in lines:
                account = line.account
                if line.debit > 0:
                    account.apply_debit(line.debit)
                if line.credit > 0:
                    account.apply_credit(line.credit)
                account.save(update_fields=['balance', 'updated_at'])

            entry.is_posted = True
            entry.posted_at = timezone.now()
            entry.save(update_fields=['is_posted', 'posted_at', 'updated_at'])

    def _print_summary(self) -> None:
        self.stdout.write('\n=== DEMO SUMMARY ===')
        for account in Account.objects.all().order_by('code'):
            self.stdout.write(f'{account.code} {account.name}: {account.balance} UZS')

        total_entries = JournalEntry.objects.count()
        posted_entries = JournalEntry.objects.filter(is_posted=True).count()
        draft_entries = JournalEntry.objects.filter(is_posted=False).count()
        self.stdout.write(
            f'\nTotal entries: {total_entries} ({posted_entries} posted, {draft_entries} draft)'
        )
        self.stdout.write('Dashboard cards, trend chart, trial balance, and balance sheet should now have data.')
