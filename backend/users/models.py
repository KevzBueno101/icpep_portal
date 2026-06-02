from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user  = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff',      True)
        extra_fields.setdefault('is_superuser',  True)
        extra_fields.setdefault('role',          'ADMIN')
        extra_fields.setdefault('position',      'PRESIDENT')
        extra_fields.setdefault('term_start',    timezone.now().date())
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):

    class Role(models.TextChoices):
        ADMIN  = 'ADMIN',  'Admin'
        MEMBER = 'MEMBER', 'Member'

    class Position(models.TextChoices):
        NONE      = 'NONE',      'None'
        PRESIDENT = 'PRESIDENT', 'President'
        TREASURER = 'TREASURER', 'Treasurer'
        SECRETARY = 'SECRETARY', 'Secretary'
    must_change_password = models.BooleanField(default=False)

    email    = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    role     = models.CharField(max_length=10, choices=Role.choices,     default=Role.MEMBER)
    position = models.CharField(max_length=20, choices=Position.choices, default=Position.NONE)

    # Term tracking
    term_start = models.DateField(null=True, blank=True)

    # Secretary delegation flag — set by President
    is_delegated = models.BooleanField(
        default=False,
        help_text='If True and position=SECRETARY, can assign Treasurer/Secretary roles.'
    )

    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    groups = models.ManyToManyField(
        'auth.Group', blank=True, related_name='custom_user_set'
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission', blank=True, related_name='custom_user_set'
    )

    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['username']

    objects = UserManager()

    def __str__(self):
        return f'{self.email} ({self.position})'

    # ── Convenience properties ──────────────────────────────────────────────

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN

    @property
    def is_term_active(self):
        """False if position is NONE (no active term)."""
        return self.position != self.Position.NONE

    @property
    def is_term_expired(self):
        """
        True when role=ADMIN but position=NONE.
        UI shows 'Term Expired' badge.
        """
        return self.role == self.Role.ADMIN and self.position == self.Position.NONE

    @property
    def has_payment_access(self):
        return self.position in [self.Position.PRESIDENT, self.Position.TREASURER]

    @property
    def has_approval_access(self):
        return self.position in [self.Position.PRESIDENT, self.Position.SECRETARY]

    @property
    def can_manage_roles(self):
        """
        True if this user is allowed to assign roles to others.
        President always can. Secretary only if is_delegated=True.
        """
        if self.position == self.Position.PRESIDENT:
            return True
        if self.position == self.Position.SECRETARY and self.is_delegated:
            return True
        return False

    def assignable_positions(self):
        """
        Returns which positions this user is allowed to assign to others.
        President → all (including President for transfer-of-power).
        Delegated Secretary → Treasurer & Secretary only.
        """
        if self.position == self.Position.PRESIDENT:
            return [
                self.Position.PRESIDENT,
                self.Position.TREASURER,
                self.Position.SECRETARY,
                self.Position.NONE,
            ]
        if self.position == self.Position.SECRETARY and self.is_delegated:
            return [
                self.Position.TREASURER,
                self.Position.SECRETARY,
                self.Position.NONE,
            ]
        return []