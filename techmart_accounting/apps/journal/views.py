"""
Views for the Journal Entry app.

Provides full CRUD for journal entries, plus the critical
POST /post/ and POST /unpost/ actions that update account balances
atomically using Django's transaction.atomic().
"""

from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as drf_filters

from .models import JournalEntry, EntryLine
from .serializers import JournalEntrySerializer, JournalEntryListSerializer
from apps.notifications.models import Notification


class JournalEntryFilter(drf_filters.FilterSet):
    """
    Custom FilterSet allowing date range, posted-status, and currency filtering.

    Supports: ?is_posted=true, ?date_from=YYYY-MM-DD, ?date_to=YYYY-MM-DD, ?currency=UZS
    """

    date_from = drf_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = drf_filters.DateFilter(field_name='date', lookup_expr='lte')
    is_posted = drf_filters.BooleanFilter(field_name='is_posted')
    currency = drf_filters.CharFilter(field_name='currency', lookup_expr='exact')

    class Meta:
        model = JournalEntry
        fields = ['is_posted', 'date_from', 'date_to', 'currency']


class JournalEntryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Journal Entries providing full CRUD plus post/unpost actions.

    List:    GET  /api/v1/journal/           (authenticated)
    Create:  POST /api/v1/journal/           (authenticated — creates with lines)
    Detail:  GET  /api/v1/journal/{id}/      (authenticated)
    Update:  PUT  /api/v1/journal/{id}/      (authenticated — draft only)
    Delete:  DELETE /api/v1/journal/{id}/    (authenticated — draft only)
    Post:    POST /api/v1/journal/{id}/post/ (authenticated)
    Unpost:  POST /api/v1/journal/{id}/unpost/ (admin only)
    """

    queryset = (
        JournalEntry.objects
        .select_related('created_by')
        .prefetch_related('lines__account')
        .order_by('-date', '-created_at')
    )
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = JournalEntryFilter
    search_fields = ['reference', 'description']
    ordering_fields = ['date', 'created_at', 'is_posted']

    @staticmethod
    def _create_notification(user, title: str, message: str) -> None:
        """Best-effort notification creation that never breaks journal workflows."""
        try:
            Notification.objects.create(user=user, title=title, message=message)
        except Exception:
            pass

    def get_serializer_class(self):
        """Use lightweight list serializer for list actions, full serializer otherwise."""
        if self.action == 'list':
            return JournalEntryListSerializer
        return JournalEntrySerializer

    def get_permissions(self):
        """
        Permission matrix:
        - list, retrieve → IsAuthenticated
        - create, update, partial_update → IsAuthenticated
        - destroy → IsAuthenticated (but only draft entries)
        - post → IsAuthenticated
        - unpost → IsAdminUser
        """
        if self.action == 'unpost_entry':
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def perform_create(self, serializer: JournalEntrySerializer) -> None:
        """Attach the requesting user as the entry creator."""
        entry = serializer.save(created_by=self.request.user)
        self._create_notification(
            self.request.user,
            'Journal entry created',
            f'Entry #{entry.id} ({entry.reference or "no reference"}) was saved as draft.',
        )

    def update(self, request: Request, *args, **kwargs) -> Response:
        """
        Update a journal entry's header and lines.

        Only draft (unposted) entries may be modified to maintain
        the immutability of the financial ledger.
        """
        entry = self.get_object()
        if entry.is_posted:
            return Response(
                {'error': 'Posted journal entries cannot be modified. Unpost the entry first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request: Request, *args, **kwargs) -> Response:
        """Block PATCH on posted entries."""
        entry = self.get_object()
        if entry.is_posted:
            return Response(
                {'error': 'Posted journal entries cannot be modified.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """
        Delete a journal entry.

        Posted entries cannot be deleted — they must be unposted first
        to preserve the audit trail.
        """
        entry = self.get_object()
        if entry.is_posted:
            return Response(
                {'error': 'Cannot delete a posted journal entry. Unpost it first.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='post', permission_classes=[IsAuthenticated])
    def post_entry(self, request: Request, pk=None) -> Response:
        """
        POST /api/v1/journal/{id}/post/

        Post the journal entry:
        1. Verify entry is not already posted (409 if so).
        2. Verify entry is balanced (400 if not).
        3. Atomically update all affected account balances.
        4. Mark entry as posted with current timestamp.

        Uses transaction.atomic() to guarantee all-or-nothing semantics.
        """
        entry = self.get_object()

        if entry.is_posted:
            return Response(
                {'error': 'This journal entry has already been posted.'},
                status=status.HTTP_409_CONFLICT,
            )

        if not entry.is_balanced():
            totals = entry.get_totals()
            return Response(
                {
                    'error': 'Journal entry is not balanced',
                    'total_debit': str(totals['total_debit']),
                    'total_credit': str(totals['total_credit']),
                    'difference': str(totals['difference']),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            lines = (
                EntryLine.objects
                .select_related('account')
                .select_for_update()
                .filter(journal=entry)
            )

            for line in lines:
                account = line.account
                if line.debit > 0:
                    account.apply_debit(line.debit)
                if line.credit > 0:
                    account.apply_credit(line.credit)
                account.save(update_fields=['balance', 'updated_at'])

            entry.is_posted = True
            entry.posted_at = timezone.now()
            entry.save(update_fields=['is_posted', 'posted_at', 'updated_at'])

        self._create_notification(
            request.user,
            'Journal entry posted',
            f'Entry #{entry.id} ({entry.reference or "no reference"}) has been posted successfully.',
        )

        serializer = JournalEntrySerializer(entry, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='unpost', permission_classes=[IsAdminUser])
    def unpost_entry(self, request: Request, pk=None) -> Response:
        """
        POST /api/v1/journal/{id}/unpost/   (Admin only)

        Reverse all account balance changes made when the entry was posted,
        then set is_posted=False. This recreates the state before posting.

        Uses transaction.atomic() to guarantee full reversal or nothing.
        """
        entry = self.get_object()

        if not entry.is_posted:
            return Response(
                {'error': 'This journal entry is not posted.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            lines = (
                EntryLine.objects
                .select_related('account')
                .select_for_update()
                .filter(journal=entry)
            )

            for line in lines:
                account = line.account
                if line.debit > 0:
                    account.reverse_debit(line.debit)
                if line.credit > 0:
                    account.reverse_credit(line.credit)
                account.save(update_fields=['balance', 'updated_at'])

            entry.is_posted = False
            entry.posted_at = None
            entry.save(update_fields=['is_posted', 'posted_at', 'updated_at'])

        self._create_notification(
            request.user,
            'Journal entry unposted',
            f'Entry #{entry.id} ({entry.reference or "no reference"}) has been moved back to draft.',
        )

        serializer = JournalEntrySerializer(entry, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
