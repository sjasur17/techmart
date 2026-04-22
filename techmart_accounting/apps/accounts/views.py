"""
Views for the Chart of Accounts app.

Provides CRUD endpoints for accounts plus an account ledger endpoint
that shows all journal entry lines touching a specific account.
"""

from django.db.models import QuerySet
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Account
from .serializers import AccountSerializer


class AccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet providing full CRUD for Chart of Accounts.

    List:   GET  /api/v1/accounts/            (authenticated)
    Create: POST /api/v1/accounts/            (admin only)
    Detail: GET  /api/v1/accounts/{id}/       (authenticated)
    Update: PUT  /api/v1/accounts/{id}/       (admin only)
    Delete: DELETE /api/v1/accounts/{id}/     (admin only — soft delete)
    Ledger: GET  /api/v1/accounts/{id}/ledger/ (authenticated)
    """

    queryset = Account.objects.all().order_by('code')
    serializer_class = AccountSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['account_type', 'is_active']
    search_fields = ['code', 'name']
    ordering_fields = ['code', 'name', 'balance', 'created_at']
    ordering = ['code']

    def get_permissions(self):
        """
        Permissions:
        - list, retrieve, ledger → IsAuthenticated
        - create, update, partial_update, destroy → IsAdminUser
        """
        if self.action in ('list', 'retrieve', 'ledger'):
            return [IsAuthenticated()]
        return [IsAdminUser()]

    def destroy(self, request: Request, *args, **kwargs) -> Response:
        """
        Soft-delete: set is_active=False instead of removing the DB row.

        Accounts with historical journal entries must never be hard-deleted
        to preserve the integrity of posted records.
        """
        account = self.get_object()
        account.is_active = False
        account.save(update_fields=['is_active', 'updated_at'])
        return Response(
            {'message': f'Account [{account.code}] {account.name} deactivated.'},
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['get'], url_path='ledger', permission_classes=[IsAuthenticated])
    def ledger(self, request: Request, pk=None) -> Response:
        """
        GET /api/v1/accounts/{id}/ledger/

        Return a paginated list of all EntryLines for this account,
        from posted journal entries only, ordered chronologically.
        """
        account = self.get_object()

        # Import here to avoid circular imports
        from apps.journal.models import EntryLine
        from apps.journal.serializers import EntryLineDetailSerializer

        lines_qs: QuerySet = (
            EntryLine.objects
            .filter(account=account, journal__is_posted=True)
            .select_related('journal', 'account')
            .order_by('journal__date', 'journal__created_at')
        )

        page = self.paginate_queryset(lines_qs)
        if page is not None:
            serializer = EntryLineDetailSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = EntryLineDetailSerializer(lines_qs, many=True)
        return Response(serializer.data)
