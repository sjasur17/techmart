from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to view or edit their notifications.
    """
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can only see their own notifications
        return Notification.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Automatically assign the request user when creating manually
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """
        Marks all unread notifications for the current user as read.
        """
        unread_notifications = self.get_queryset().filter(is_read=False)
        updated_count = unread_notifications.update(is_read=True)
        return Response(
            {"message": f"{updated_count} notifications marked as read."},
            status=status.HTTP_200_OK
        )
