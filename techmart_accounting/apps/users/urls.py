"""
URL patterns for the users/auth app.
"""

from django.urls import path
from .views import LoginView, TokenRefreshAPIView, LogoutView, CurrentUserView, RegisterView

app_name = 'auth'

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshAPIView.as_view(), name='token-refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', CurrentUserView.as_view(), name='me'),
    path('register/', RegisterView.as_view(), name='register'),
]
