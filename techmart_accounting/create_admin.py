import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "techmart_accounting.settings")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
try:
    if not User.objects.filter(email='admin@techmart.uz').exists():
        # Check if username is required
        try:
            User.objects.create_superuser(username='admin_techmart', email='admin@techmart.uz', password='admin123')
        except Exception:
            User.objects.create_superuser(email='admin@techmart.uz', password='admin123')
        print("User created successfully.")
    else:
        # User exists, let's reset password just in case
        u = User.objects.get(email='admin@techmart.uz')
        u.set_password('admin123')
        u.save()
        print("User password updated.")
except Exception as e:
    print(f"Error: {e}")
