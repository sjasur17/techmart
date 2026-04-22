import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "techmart_accounting.settings.local")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.contrib.auth import get_user_model
from apps.accounts.models import Account
from apps.journal.models import JournalEntry

User = get_user_model()

print("=== DATABASE STATUS ===")
print(f"Users: {User.objects.count()}")
print(f"Accounts: {Account.objects.count()}")
print(f"Journal entries: {JournalEntry.objects.count()}")

u = User.objects.filter(email='admin@techmart.uz').first()
if u:
    print(f"\nAdmin user found: {u.email}")
    print(f"  is_active: {u.is_active}")
    print(f"  is_staff: {u.is_staff}")
    from django.contrib.auth import authenticate
    authed = authenticate(email='admin@techmart.uz', password='admin123')
    print(f"  authenticate() result: {'OK' if authed else 'FAILED - wrong password or backend issue'}")
else:
    print("\nERROR: Admin user NOT found!")
