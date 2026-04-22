"""
Django Admin configuration for Journal Entry and Entry Line models.
"""

from django.contrib import admin
from django.utils import timezone
from django.utils.html import format_html

from .models import JournalEntry, EntryLine


class EntryLineInline(admin.TabularInline):
    """Inline editor for EntryLine within JournalEntry admin."""

    model = EntryLine
    extra = 2
    fields = ('account', 'debit', 'credit', 'memo')
    readonly_fields = ()
    min_num = 2

    def get_readonly_fields(self, request, obj=None):
        """Make lines read-only if the entry is already posted."""
        if obj and obj.is_posted:
            return ('account', 'debit', 'credit', 'memo')
        return ()


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    """
    Admin interface for JournalEntry with inline lines and posting action.
    """

    list_display = (
        'id', 'date', 'short_description', 'reference',
        'created_by', 'is_posted', 'balance_status', 'created_at'
    )
    list_display_links = ('id', 'date', 'short_description')
    list_filter = ('is_posted', 'date', 'created_by')
    search_fields = ('description', 'reference', 'created_by__email')
    readonly_fields = ('is_posted', 'posted_at', 'created_at', 'updated_at', 'created_by')
    ordering = ('-date', '-created_at')
    date_hierarchy = 'date'
    inlines = [EntryLineInline]
    list_per_page = 30

    fieldsets = (
        ('Entry Header', {
            'fields': ('date', 'description', 'reference', 'created_by'),
        }),
        ('Status', {
            'fields': ('is_posted', 'posted_at'),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    actions = ['post_selected_entries', 'unpost_selected_entries']

    def short_description(self, obj: JournalEntry) -> str:
        """Truncate description for list display."""
        return obj.description[:60] + '…' if len(obj.description) > 60 else obj.description
    short_description.short_description = 'Description'

    def balance_status(self, obj: JournalEntry) -> str:
        """Display colored balance status badge."""
        if obj.is_balanced():
            return format_html('<span style="color:green;font-weight:bold;">✔ Balanced</span>')
        return format_html('<span style="color:red;font-weight:bold;">✘ Unbalanced</span>')
    balance_status.short_description = 'Balance'

    @admin.action(description='Post selected journal entries')
    def post_selected_entries(self, request, queryset):
        """Post all selected draft entries that are balanced."""
        posted = 0
        errors = []
        for entry in queryset.filter(is_posted=False):
            if entry.is_balanced():
                from django.db import transaction
                with transaction.atomic():
                    for line in entry.lines.select_related('account').select_for_update():
                        account = line.account
                        if line.debit > 0:
                            account.apply_debit(line.debit)
                        if line.credit > 0:
                            account.apply_credit(line.credit)
                        account.save(update_fields=['balance', 'updated_at'])
                    entry.is_posted = True
                    entry.posted_at = timezone.now()
                    entry.save(update_fields=['is_posted', 'posted_at', 'updated_at'])
                posted += 1
            else:
                errors.append(f'Entry #{entry.id} is not balanced.')

        if posted:
            self.message_user(request, f'{posted} entry/entries posted successfully.')
        for err in errors:
            self.message_user(request, err, level='warning')

    @admin.action(description='Unpost selected journal entries (Admin)')
    def unpost_selected_entries(self, request, queryset):
        """Reverse and unpost all selected posted entries."""
        if not request.user.is_superuser:
            self.message_user(request, 'Only superusers can unpost entries.', level='error')
            return
        unposted = 0
        from django.db import transaction
        for entry in queryset.filter(is_posted=True):
            with transaction.atomic():
                for line in entry.lines.select_related('account').select_for_update():
                    account = line.account
                    if line.debit > 0:
                        account.reverse_debit(line.debit)
                    if line.credit > 0:
                        account.reverse_credit(line.credit)
                    account.save(update_fields=['balance', 'updated_at'])
                entry.is_posted = False
                entry.posted_at = None
                entry.save(update_fields=['is_posted', 'posted_at', 'updated_at'])
            unposted += 1
        self.message_user(request, f'{unposted} entry/entries unposted.')


@admin.register(EntryLine)
class EntryLineAdmin(admin.ModelAdmin):
    """Admin interface for individual Entry Lines."""

    list_display = ('id', 'journal', 'account', 'debit', 'credit', 'memo')
    list_display_links = ('id', 'journal')
    list_filter = ('account', 'journal__is_posted')
    search_fields = ('account__code', 'account__name', 'memo', 'journal__reference')
    list_select_related = ('journal', 'account')
    list_per_page = 50

    def get_readonly_fields(self, request, obj=None):
        """Lines in posted entries are read-only."""
        if obj and obj.journal.is_posted:
            return ('journal', 'account', 'debit', 'credit', 'memo')
        return ()
