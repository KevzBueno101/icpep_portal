from django.conf import settings
from django.db import models


class Announcement(models.Model):
    class Category(models.TextChoices):
        ANNOUNCEMENT = 'announcement', 'Announcement'
        ACHIEVEMENT = 'achievement', 'Achievement'
        UPDATE = 'update', 'Update'
        OPPORTUNITY = 'opportunity', 'Opportunity'
        EVENT = 'event', 'Event'

    title = models.CharField(max_length=200)
    body = models.TextField()
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.ANNOUNCEMENT,
    )
    tags = models.CharField(max_length=500, null=True, blank=True, help_text='Comma-separated tags for badges (e.g., urgent, scholarship, competition)')
    author = models.CharField(max_length=150, blank=True, default='Admin')
    pinned = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0, db_index=True)
    is_published = models.BooleanField(default=True)
    members_only = models.BooleanField(default=False, help_text='If checked, only visible to authenticated members')
    event_date_start = models.DateField(null=True, blank=True, help_text='Event start date (optional)')
    event_date_end = models.DateField(null=True, blank=True, help_text='Event end date (optional)')
    event_time_start = models.TimeField(null=True, blank=True, help_text='Event start time (optional)')
    event_time_end = models.TimeField(null=True, blank=True, help_text='Event end time (optional)')
    location = models.CharField(max_length=200, null=True, blank=True, help_text='Event location (optional)')
    email_blast_sent_at = models.DateTimeField(null=True, blank=True, help_text='When an email blast was last triggered for this announcement (any published announcement)')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='announcements',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-created_at']
        verbose_name = 'Announcement'
        verbose_name_plural = 'Announcements'

    def __str__(self):
        return self.title


class AnnouncementImage(models.Model):
    announcement = models.ForeignKey(
        Announcement,
        on_delete=models.CASCADE,
        related_name='images',
    )
    image = models.ImageField(upload_to='announcement_images/')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name = 'Announcement Image'
        verbose_name_plural = 'Announcement Images'

    def __str__(self):
        return f'{self.announcement.title} - Image {self.order}'


class BlastLog(models.Model):
    """One row per email-blast run for an announcement.

    Used to honor the Brevo daily quota: ``sent_count`` tracks how many
    recipients were attempted so a later flush command can resume safely.
    """
    announcement = models.ForeignKey(
        Announcement,
        on_delete=models.CASCADE,
        related_name='blast_logs',
    )
    recipient_count = models.PositiveIntegerField(default=0)
    sent_count = models.PositiveIntegerField(default=0)
    failed_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Announcement Blast Log'
        verbose_name_plural = 'Announcement Blast Logs'

    def __str__(self):
        return f'Blast #{self.id} for "{self.announcement.title}" ({self.sent_count}/{self.recipient_count})'
