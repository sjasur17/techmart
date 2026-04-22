import os
import django

# Use current environment settings module; default to production for Render.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "techmart_accounting.settings.production")
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()
admin_email = os.getenv('ADMIN_EMAIL', 'admin@techmart.uz')
admin_password = os.getenv('ADMIN_PASSWORD', 'Admin123!Tech')
admin_username = os.getenv('ADMIN_USERNAME', 'admin_techmart')

try:
    if not User.objects.filter(email=admin_email).exists():
        try:
            User.objects.create_superuser(
                username=admin_username,
                email=admin_email,
                password=admin_password,
            )
        except Exception:
            User.objects.create_superuser(email=admin_email, password=admin_password)
        print("User created successfully.")
    else:
        u = User.objects.get(email=admin_email)
        u.username = u.username or admin_username
        u.is_staff = True
        u.is_superuser = True
        u.set_password(admin_password)
        u.save()
        print("User password updated.")
except Exception as e:
    print(f"Error: {e}")
