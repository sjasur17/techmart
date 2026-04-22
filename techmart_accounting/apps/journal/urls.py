"""
URL patterns for the Journal app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import JournalEntryViewSet

app_name = 'journal'

router = DefaultRouter()
router.register(r'', JournalEntryViewSet, basename='journal')

urlpatterns = [
    path('', include(router.urls)),
]
