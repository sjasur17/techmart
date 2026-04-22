"""
Custom User model for TechMart Savdo Financial Accounting API.

Extends AbstractUser to allow future profile additions (e.g., department,
role descriptions) without schema migrations.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model for TechMart Savdo.

    Adds additional fields beyond Django's default User for accounting context.
    """

    email = models.EmailField(unique=True, help_text='Required. Used as identifier.')
    is_accountant = models.BooleanField(
        default=False,
        help_text='Designates whether this user can post/unpost journal entries.',
    )
    department = models.CharField(
        max_length=100,
        blank=True,
        help_text='Department or business unit (e.g., Finance, Operations).',
    )
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']

    def __str__(self) -> str:
        return f"{self.get_full_name() or self.username} <{self.email}>"

    def get_full_name(self) -> str:
        """Return full name or fall back to username."""
        full = super().get_full_name()
        return full.strip() or self.username
