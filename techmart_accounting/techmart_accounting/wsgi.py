"""
WSGI config for techmart_accounting project.

Exposes the WSGI callable as a module-level variable named ``application``.
Used by Gunicorn in production deployment on Google Cloud Run.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'techmart_accounting.settings.local')

application = get_wsgi_application()
