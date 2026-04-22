"""
Production settings for TechMart Savdo Financial Accounting API.

Deployed on Google Cloud Run. All secrets are injected via environment variables.
"""

from .base import *  # noqa: F401, F403
from decouple import config
import dj_database_url

# ---------------------------------------------------------------------------
# Security
# ---------------------------------------------------------------------------

SECRET_KEY = config('SECRET_KEY')

DEBUG = False

ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv())

# ---------------------------------------------------------------------------
# HTTPS / Security Headers
# ---------------------------------------------------------------------------

SECURE_HSTS_SECONDS = 31536000          # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=False, cast=bool)
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# ---------------------------------------------------------------------------
# Database — Cloud SQL via DATABASE_URL
# ---------------------------------------------------------------------------

database_url = config('DATABASE_URL', default='').strip()
valid_db_schemes = ('postgres://', 'postgresql://', 'cockroach://')

if database_url.startswith(valid_db_schemes):
    try:
        DATABASES = {
            'default': dj_database_url.parse(
                database_url,
                conn_max_age=600,
                conn_health_checks=True,
            )
        }
    except Exception:
        DATABASES = {
            'default': {
                'ENGINE': 'django.db.backends.sqlite3',
                'NAME': BASE_DIR / 'db.sqlite3',
            }
        }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# ---------------------------------------------------------------------------
# CORS — only allow listed origins in production
# ---------------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = [
    origin if origin.startswith(('http://', 'https://')) else f'https://{origin}'
    for origin in config('CORS_ALLOWED_ORIGINS', default='', cast=Csv())
    if origin
]
CORS_ALLOW_CREDENTIALS = True

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'WARNING',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': config('DJANGO_LOG_LEVEL', default='WARNING'),
            'propagate': False,
        },
    },
}

# ---------------------------------------------------------------------------
# Email (configure with SendGrid or SMTP in Cloud Run env)
# ---------------------------------------------------------------------------

EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.smtp.EmailBackend'
)
EMAIL_HOST = config('EMAIL_HOST', default='smtp.sendgrid.net')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@techmart.uz')
