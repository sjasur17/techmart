import os, sys, django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "techmart_accounting.settings.local")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from decimal import Decimal
from django.utils import timezone
from django.db import transaction
from apps.accounts.models import Account
from apps.journal.models import JournalEntry, EntryLine
from apps.users.models import User

user = User.objects.get(email='admin@techmart.uz')

cash       = Account.objects.get(code='1010')
receivable = Account.objects.get(code='1200')
payable    = Account.objects.get(code='2100')
sales      = Account.objects.get(code='4100')
cogs       = Account.objects.get(code='5100')

def post_entry(entry):
    with transaction.atomic():
        lines = EntryLine.objects.select_related('account').select_for_update().filter(journal=entry)
        for line in lines:
            acc = line.account
            if line.debit > 0:
                acc.apply_debit(line.debit)
            if line.credit > 0:
                acc.apply_credit(line.credit)
            acc.save()
        entry.is_posted = True
        entry.posted_at = timezone.now()
        entry.save()

# Entry 1: Cash Sale — POSTED
e1 = JournalEntry.objects.create(date=timezone.now().date(), description='Cash sale to customer', reference='INV-2026-001', created_by=user)
EntryLine.objects.create(journal=e1, account=cash,  debit=Decimal('15000000'), credit=Decimal('0'))
EntryLine.objects.create(journal=e1, account=sales, debit=Decimal('0'),        credit=Decimal('15000000'))
post_entry(e1)
print("Posted Entry 1: Cash Sale 15,000,000 UZS")

# Entry 2: Buy inventory on credit — POSTED
e2 = JournalEntry.objects.create(date=timezone.now().date(), description='Purchase inventory from supplier', reference='BILL-2026-001', created_by=user)
EntryLine.objects.create(journal=e2, account=cogs,    debit=Decimal('6000000'), credit=Decimal('0'))
EntryLine.objects.create(journal=e2, account=payable, debit=Decimal('0'),       credit=Decimal('6000000'))
post_entry(e2)
print("Posted Entry 2: Inventory Purchase 6,000,000 UZS")

# Entry 3: Another sales — POSTED
e3 = JournalEntry.objects.create(date=timezone.now().date(), description='Online store revenue Q1', reference='INV-2026-002', created_by=user)
EntryLine.objects.create(journal=e3, account=receivable, debit=Decimal('8000000'), credit=Decimal('0'))
EntryLine.objects.create(journal=e3, account=sales,      debit=Decimal('0'),       credit=Decimal('8000000'))
post_entry(e3)
print("Posted Entry 3: Credit Sale 8,000,000 UZS")

# Entry 4: Draft (unposted)
e4 = JournalEntry.objects.create(date=timezone.now().date(), description='Pending supplier payment (draft)', reference='DRAFT-001', created_by=user)
EntryLine.objects.create(journal=e4, account=cogs,    debit=Decimal('3000000'), credit=Decimal('0'))
EntryLine.objects.create(journal=e4, account=payable, debit=Decimal('0'),       credit=Decimal('3000000'))
print("Created Entry 4: Draft entry (not posted)")

print("\n=== FINAL STATE ===")
from apps.accounts.models import Account as A
for acc in A.objects.all().order_by('code'):
    print(f"  {acc.code} {acc.name}: {acc.balance} UZS")

from apps.journal.models import JournalEntry as J
print(f"\nTotal entries: {J.objects.count()} ({J.objects.filter(is_posted=True).count()} posted, {J.objects.filter(is_posted=False).count()} draft)")
print("\nDone! Refresh your browser dashboard.")
