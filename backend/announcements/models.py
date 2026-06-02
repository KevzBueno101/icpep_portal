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
    author = models.CharField(max_length=150, blank=True, default='Admin')
    pinned = models.BooleanField(default=False)
    is_published = models.BooleanField(default=True)
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
        ordering = ['-created_at']
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
