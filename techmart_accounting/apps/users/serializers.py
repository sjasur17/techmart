"""
Serializers for the users app — registration, profile, and JWT response.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserProfileSerializer(serializers.ModelSerializer):
    """Read-only serializer for the current user's profile."""

    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name',
            'first_name', 'last_name', 'department',
            'phone', 'avatar_url', 'is_accountant', 'is_staff',
            'date_joined', 'last_login',
        ]
        read_only_fields = fields

    def get_full_name(self, obj: User) -> str:
        return obj.get_full_name()

    def get_avatar_url(self, obj: User):
        request = self.context.get('request')
        if not obj.avatar:
            return None

        avatar_url = obj.avatar.url
        if request is not None:
            return request.build_absolute_uri(avatar_url)
        return avatar_url


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating the current user's own profile (non-sensitive fields)."""

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'department', 'phone', 'avatar']


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for creating new user accounts (admin-initiated)."""

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True, label='Confirm password')

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'department', 'phone', 'is_accountant',
        ]

    def validate(self, attrs: dict) -> dict:
        if attrs['password'] != attrs.pop('password2'):
            raise serializers.ValidationError({'password': "Passwords do not match."})
        return attrs

    def create(self, validated_data: dict) -> User:
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Extends JWT token pair to include basic user info in the login response
    so the React frontend does not need a separate /me/ call on first load.
    """

    def validate(self, attrs: dict) -> dict:
        data = super().validate(attrs)
        data['user'] = UserProfileSerializer(self.user, context=self.context).data
        return data
