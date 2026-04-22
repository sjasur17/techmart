"""
URL patterns for the Financial Reports app.
"""

from django.urls import path
from .views import (
    TrialBalanceView,
    IncomeStatementView,
    BalanceSheetView,
    DashboardView,
    ExportTrialBalanceCSVView,
    ExportJournalEntriesCSVView,
    AIAssistantView,
    HelpAIAssistantView,
)

app_name = 'reports'

urlpatterns = [
    path('trial-balance/', TrialBalanceView.as_view(), name='trial-balance'),
    path('income-statement/', IncomeStatementView.as_view(), name='income-statement'),
    path('balance-sheet/', BalanceSheetView.as_view(), name='balance-sheet'),
    path('trial-balance/export/', ExportTrialBalanceCSVView.as_view(), name='trial-balance-export'),
    path('journal-entries/export/', ExportJournalEntriesCSVView.as_view(), name='journal-entries-export'),
    path('ai-assistant/', AIAssistantView.as_view(), name='ai-assistant'),
    path('help-assistant/', HelpAIAssistantView.as_view(), name='help-ai-assistant'),
]
