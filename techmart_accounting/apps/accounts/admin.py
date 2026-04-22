"""
Admin configuration for the Chart of Accounts.
"""

from django.contrib import admin
from .models import Account


@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    """
    Admin interface for Account model.

    Provides full filtering, search, and inline balance visibility.
    """

    list_display = ('code', 'name', 'account_type', 'balance', 'is_active', 'updated_at')
    list_display_links = ('code', 'name')
    list_filter = ('account_type', 'is_active')
    search_fields = ('code', 'name')
    readonly_fields = ('balance', 'created_at', 'updated_at')
    ordering = ('code',)
    list_per_page = 50

    fieldsets = (
        ('Account Information', {
            'fields': ('code', 'name', 'account_type', 'is_active'),
        }),
        ('Balance (Read-Only — Updated via Journal Posting)', {
            'fields': ('balance',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    actions = ['activate_accounts', 'deactivate_accounts']

    @admin.action(description='Activate selected accounts')
    def activate_accounts(self, request, queryset):
        """Mark selected accounts as active."""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} account(s) activated.')

    @admin.action(description='Deactivate selected accounts (soft delete)')
    def deactivate_accounts(self, request, queryset):
        """Mark selected accounts as inactive (soft delete)."""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} account(s) deactivated.')
