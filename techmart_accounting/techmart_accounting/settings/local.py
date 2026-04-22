"""
Local development settings for TechMart Savdo Financial Accounting API.
"""

from .base import *  # noqa: F401, F403
from decouple import config
import dj_database_url

SECRET_KEY = config('SECRET_KEY', default='django-insecure-local-dev-secret-key-change-me')

DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,0.0.0.0', cast=Csv())

# ---------------------------------------------------------------------------
# Database — supports DATABASE_URL or falls back to SQLite for quickstart
# ---------------------------------------------------------------------------

database_url = config('DATABASE_URL', default='')

if database_url:
    DATABASES = {
        'default': dj_database_url.parse(
            database_url,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ---------------------------------------------------------------------------
# CORS — allow React dev server
# ---------------------------------------------------------------------------

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Email backend (console for local dev)
# ---------------------------------------------------------------------------

EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# ---------------------------------------------------------------------------
# Django Debug Toolbar (optional — only installed if available)
# ---------------------------------------------------------------------------

try:
    import debug_toolbar  # noqa: F401
    INSTALLED_APPS.append('debug_toolbar')  # noqa: F405
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')  # noqa: F405
    INTERNAL_IPS = ['127.0.0.1']
except ImportError:
    pass
