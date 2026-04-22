"""
Views for the users/auth app.

Provides JWT login, token refresh, logout (blacklist), current user profile,
and admin-level user registration.
"""

from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    UserUpdateSerializer,
    RegisterSerializer,
)

User = get_user_model()


class LoginView(TokenObtainPairView):
    """
    POST /api/v1/auth/login/

    Authenticate with email + password. Returns JWT access & refresh tokens
    along with the user profile payload so the React app can bootstrap state
    in a single request.
    """

    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer


class TokenRefreshAPIView(TokenRefreshView):
    """
    POST /api/v1/auth/refresh/

    Exchange a valid refresh token for a new access token.
    """

    permission_classes = [AllowAny]


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/

    Blacklist the provided refresh token, effectively logging the user out.
    The access token will expire naturally via its short TTL.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request) -> Response:
        """Accept refresh token in request body and blacklist it."""
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Successfully logged out.'},
                status=status.HTTP_200_OK,
            )
        except TokenError as exc:
            return Response(
                {'error': str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CurrentUserView(APIView):
    """
    GET  /api/v1/auth/me/   → Retrieve current user profile.
    PATCH /api/v1/auth/me/  → Update non-sensitive profile fields.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        """Return the authenticated user's profile."""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request) -> Response:
        """Allow users to update their own name, department, and phone."""
        serializer = UserUpdateSerializer(
            request.user, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserProfileSerializer(request.user, context={'request': request}).data)


class RegisterView(generics.CreateAPIView):
    """
    POST /api/v1/auth/register/

    Create a new user account. Admin only — regular signup is not permitted
    to prevent unauthorized access to financial data.
    """

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs) -> Response:
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserProfileSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )
