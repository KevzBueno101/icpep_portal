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
        ADMIN   = 'ADMIN',   'Admin'
        OFFICER = 'OFFICER', 'Officer'

    class YearLevel(models.TextChoices):
        FOURTH = '4', '4th Year'
        THIRD = '3', '3rd Year'
        SECOND = '2', '2nd Year'
        FIRST = '1', '1st Year'
    must_change_password = models.BooleanField(default=False)

    email    = models.EmailField(unique=True)
    username = models.CharField(max_length=150, unique=True)
    first_name = models.CharField(max_length=150, blank=True, default='')
    last_name = models.CharField(max_length=150, blank=True, default='')
    profile_picture = models.ImageField(upload_to='admin_profiles/', null=True, blank=True, max_length=500)
    role     = models.CharField(max_length=10, choices=Role.choices,     default=Role.OFFICER)
    position = models.CharField(max_length=100, blank=True, default='')
    year_level = models.CharField(max_length=1, choices=YearLevel.choices, null=True, blank=True)
    department = models.CharField(max_length=100, blank=True, default='')
    academic_year = models.CharField(max_length=20, blank=True, default='')

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
        return self.role in [self.Role.ADMIN, self.Role.OFFICER]

    @property
    def is_term_active(self):
        """False if position is empty (no active term)."""
        return bool(self.position)

    @property
    def is_term_expired(self):
        """
        True when role=ADMIN but position is empty.
        UI shows 'Term Expired' badge.
        """
        return self.role == self.Role.ADMIN and not self.position

    @property
    def has_payment_access(self):
        """President and Finance-related positions have payment access."""
        position_lower = self.position.lower() if self.position else ''
        return (
            'president' in position_lower or
            'finance' in position_lower or
            'treasurer' in position_lower
        )

    @property
    def has_approval_access(self):
        """President, Vice Presidents, and Secretaries have approval access."""
        position_lower = self.position.lower() if self.position else ''
        return (
            'president' in position_lower or
            'vice president' in position_lower or
            'secretary' in position_lower
        )

    @property
    def can_manage_roles(self):
        """
        True if this user is allowed to assign roles to others.
        Admin always can. Officer with President position can.
        Secretary only if is_delegated=True.
        """
        if self.role == self.Role.ADMIN:
            return True
        position_lower = self.position.lower() if self.position else ''
        if self.role == self.Role.OFFICER and 'president' in position_lower:
            return True
        if 'secretary' in position_lower and self.is_delegated:
            return True
        return False

    @property
    def can_add_announcements(self):
        """
        True if this user is allowed to add announcements.
        Officers can add announcements.
        """
        return self.role in [self.Role.ADMIN, self.Role.OFFICER]

    def assignable_positions(self):
        """
        Returns which positions this user is allowed to assign to others.
        Since positions are now dynamic, return empty list (all positions allowed).
        """
        return []