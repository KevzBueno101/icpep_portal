from django.conf import settings
from django.db import models


class AuditLog(models.Model):
    class ActionType(models.TextChoices):
        MEMBER_APPROVED = 'MEMBER_APPROVED', 'Member Approved'
        MEMBER_REJECTED = 'MEMBER_REJECTED', 'Member Rejected'
        MEMBER_CREATED = 'MEMBER_CREATED', 'Member Created'
        MEMBER_UPDATED = 'MEMBER_UPDATED', 'Member Updated'
        MEMBER_DELETED = 'MEMBER_DELETED', 'Member Deleted'
        ROLE_ASSIGNED = 'ROLE_ASSIGNED', 'Role Assigned'
        ROLE_DELEGATED = 'ROLE_DELEGATED', 'Role Delegated'
        ADMIN_CREATED = 'ADMIN_CREATED', 'Admin Created'
        ADMIN_UPDATED = 'ADMIN_UPDATED', 'Admin Updated'
        ADMIN_DELETED = 'ADMIN_DELETED', 'Admin Deleted'
        MILESTONE_CREATED = 'MILESTONE_CREATED', 'Milestone Created'
        MILESTONE_UPDATED = 'MILESTONE_UPDATED', 'Milestone Updated'
        MILESTONE_DELETED = 'MILESTONE_DELETED', 'Milestone Deleted'
        MILESTONE_IMAGE_UPLOADED = 'MILESTONE_IMAGE_UPLOADED', 'Milestone Image Uploaded'
        MILESTONE_IMAGE_DELETED = 'MILESTONE_IMAGE_DELETED', 'Milestone Image Deleted'
        ANNOUNCEMENT_CREATED = 'ANNOUNCEMENT_CREATED', 'Announcement Created'
        ANNOUNCEMENT_UPDATED = 'ANNOUNCEMENT_UPDATED', 'Announcement Updated'
        ANNOUNCEMENT_DELETED = 'ANNOUNCEMENT_DELETED', 'Announcement Deleted'
        ANNOUNCEMENT_IMAGE_UPLOADED = 'ANNOUNCEMENT_IMAGE_UPLOADED', 'Announcement Image Uploaded'
        ANNOUNCEMENT_IMAGE_DELETED = 'ANNOUNCEMENT_IMAGE_DELETED', 'Announcement Image Deleted'
        YEAR_END_RESET = 'YEAR_END_RESET', 'Year-End Reset'
        PAYMENT_SETTINGS_UPDATED = 'PAYMENT_SETTINGS_UPDATED', 'Payment Settings Updated'

    class EntityType(models.TextChoices):
        MEMBER = 'Member', 'Member'
        USER = 'User', 'User'
        MILESTONE = 'Milestone', 'Milestone'
        ANNOUNCEMENT = 'Announcement', 'Announcement'
        PAYMENT_SETTINGS = 'PaymentSettings', 'Payment Settings'

    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='audit_logs'
    )
    action_type = models.CharField(max_length=50, choices=ActionType.choices, db_index=True)
    entity_type = models.CharField(max_length=50, choices=EntityType.choices, db_index=True)
    entity_id = models.IntegerField(null=True, blank=True, db_index=True)
    entity_name = models.CharField(max_length=255, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        indexes = [
            models.Index(fields=['timestamp']),
            models.Index(fields=['action_type']),
            models.Index(fields=['entity_type']),
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        admin = self.admin_user.email if self.admin_user else 'Unknown'
        return f'{self.timestamp} - {admin} - {self.get_action_type_display()}'
