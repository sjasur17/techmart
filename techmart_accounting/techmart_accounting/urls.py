"""
TechMart Savdo Financial Accounting API — Root URL Configuration.

All API routes are namespaced under /api/v1/.
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from apps.reports.views import DashboardView


def health_check(request):
    """Health check endpoint for Cloud Run liveness probes."""
    return JsonResponse({'status': 'ok', 'service': 'techmart-accounting-api'})


def api_root(request):
    """Simple API discovery endpoint."""
    return JsonResponse(
        {
            'status': 'ok',
            'api': 'v1',
            'endpoints': {
                'auth': '/api/v1/auth/',
                'accounts': '/api/v1/accounts/',
                'journal': '/api/v1/journal/',
                'reports': '/api/v1/reports/',
                'notifications': '/api/v1/notifications/',
                'dashboard': '/api/v1/dashboard/',
            },
        }
    )


urlpatterns = [
    # Admin
    path('admin/', admin.site.urls),

    # Root path for Render/browser checks
    path('', health_check, name='home'),

    # Health check (no auth required for Cloud Run)
    path('health/', health_check, name='health-check'),

    # API v1
    path('api/v1/', api_root, name='api-root'),
    path('api/v1/auth/', include('apps.users.urls', namespace='auth')),
    path('api/v1/accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('api/v1/journal/', include('apps.journal.urls', namespace='journal')),
    path('api/v1/reports/', include('apps.reports.urls', namespace='reports')),
    path('api/v1/notifications/', include('apps.notifications.urls', namespace='notifications')),
    
    # Dashboard is in reports app but root path as per requirements
    path('api/v1/dashboard/', DashboardView.as_view(), name='dashboard'),
]


# Customize admin site
admin.site.site_header = 'TechMart Savdo — Financial Admin'
admin.site.site_title = 'TechMart Accounting'
admin.site.index_title = 'Financial Administration'

if settings.MEDIA_URL and settings.MEDIA_ROOT:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
