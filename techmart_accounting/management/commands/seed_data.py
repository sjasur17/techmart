import sys
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Account
from apps.journal.models import JournalEntry, EntryLine

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with initial accounts, user, and some sample journal entries.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting database seed...')

        # 1. Create superuser if it doesn't exist
        user, created = User.objects.get_or_create(
            email='admin@techmart.uz',
            defaults={
                'username': 'admin',
                'first_name': 'TechMart',
                'last_name': 'Admin',
                'is_staff': True,
                'is_superuser': True,
                'is_accountant': True
            }
        )
        if created:
            user.set_password('admin123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created superuser: admin@techmart.uz (admin123)'))
        else:
            self.stdout.write('Superuser already exists: admin@techmart.uz')

        # 2. Load account fixtures
        self.stdout.write('Loading account fixtures...')
        try:
            call_command('loaddata', 'fixtures/accounts.json')
            self.stdout.write(self.style.SUCCESS('Successfully loaded accounts.json'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to load accounts.json: {e}'))

        # Fetch accounts for journal entries creation
        try:
            cash = Account.objects.get(code='1010')
            receivable = Account.objects.get(code='1200')
            payable = Account.objects.get(code='2100')
            sales = Account.objects.get(code='4100')
            cogs = Account.objects.get(code='5100')
        except Account.DoesNotExist as e:
            self.stdout.write(self.style.ERROR('Accounts fixture didn\'t load properly, stopping journals creation.'))
            sys.exit(1)

        # 3. Create 3 balanced journal entries
        self.stdout.write('Creating sample journal entries...')

        entries = []

        # Entry 1: Cash sale - Posted
        entry1 = JournalEntry.objects.create(
            date=timezone.now().date(),
            description='Cash sale to customer',
            reference='INV-2025-001',
            created_by=user,
        )
        EntryLine.objects.create(journal=entry1, account=cash, debit=Decimal('5000000.00'), credit=Decimal('0'))
        EntryLine.objects.create(journal=entry1, account=sales, debit=Decimal('0'), credit=Decimal('5000000.00'))
        entries.append(entry1)

        # Entry 2: Buy inventory on credit (increase COGS, increase Payable) - Posted
        entry2 = JournalEntry.objects.create(
            date=timezone.now().date(),
            description='Purchase inventory from supplier on credit',
            reference='BILL-2025-001',
            created_by=user,
        )
        EntryLine.objects.create(journal=entry2, account=cogs, debit=Decimal('2000000.00'), credit=Decimal('0'))
        EntryLine.objects.create(journal=entry2, account=payable, debit=Decimal('0'), credit=Decimal('2000000.00'))
        entries.append(entry2)

        # Entry 3: Unposted draft entry
        entry3 = JournalEntry.objects.create(
            date=timezone.now().date(),
            description='Sale on credit to VIP customer',
            reference='INV-2025-002',
            created_by=user,
        )
        EntryLine.objects.create(journal=entry3, account=receivable, debit=Decimal('1000000.00'), credit=Decimal('0'))
        EntryLine.objects.create(journal=entry3, account=sales, debit=Decimal('0'), credit=Decimal('1000000.00'))
        entries.append(entry3)

        self.stdout.write(self.style.SUCCESS('Successfully created 3 sample journal entries.'))

        # 4. Post 2 of them
        self.stdout.write('Posting 2 of the entries...')
        for entry in [entry1, entry2]:
            with transaction.atomic():
                lines = EntryLine.objects.select_related('account').select_for_update().filter(journal=entry)
                for line in lines:
                    account = line.account
                    if line.debit > 0:
                        account.apply_debit(line.debit)
                    if line.credit > 0:
                        account.apply_credit(line.credit)
                    account.save()
                entry.is_posted = True
                entry.posted_at = timezone.now()
                entry.save()
        
        self.stdout.write(self.style.SUCCESS('Successfully posted 2 sample journal entries.'))
        self.stdout.write(self.style.SUCCESS('\n======================================'))
        self.stdout.write(self.style.SUCCESS('Seed data script completed successfully!'))
        self.stdout.write(self.style.SUCCESS('======================================\n'))
