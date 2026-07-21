from django.conf import settings
from django.db import models
from django.utils import timezone


class FailedLoginAttempt(models.Model):
    email = models.EmailField(db_index=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['email', 'created_at']),
        ]

    def __str__(self):
        return f"{self.email} @ {self.created_at.isoformat()}"


class PasswordResetToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.CharField(max_length=128, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['user', 'token']),
        ]

    def is_expired(self):
        timeout = getattr(settings, 'PASSWORD_RESET_TIMEOUT', 86400)
        return (timezone.now() - self.created_at).total_seconds() > timeout

    def __str__(self):
        return f"Reset token for {self.user} ({'used' if self.is_used else 'active'})"
