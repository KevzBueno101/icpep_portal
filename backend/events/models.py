from django.db import models


class Event(models.Model):
    class RegistrationStatus(models.TextChoices):
        OPEN = 'open', 'Open'
        CLOSED = 'closed', 'Closed'
        FULL = 'full', 'Full'

    title = models.CharField(max_length=200)
    description = models.TextField()
    content = models.TextField()
    banner_image = models.ImageField(upload_to='event_banners/')
    date = models.DateTimeField()
    location = models.CharField(max_length=200)
    is_online = models.BooleanField(default=False)
    meeting_link = models.URLField(blank=True, null=True)
    organizer_name = models.CharField(max_length=200)
    organizer_logo = models.ImageField(upload_to='organizer_logos/', blank=True, null=True)
    tags = models.JSONField(default=list, blank=True, help_text='List of tags e.g. ["Workshop", "Webinar", "AI"]')
    registration_status = models.CharField(
        max_length=20,
        choices=RegistrationStatus.choices,
        default=RegistrationStatus.OPEN
    )
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', '-date']
        verbose_name = 'Event'
        verbose_name_plural = 'Events'

    def __str__(self):
        return self.title


class EventImage(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name='gallery_images'
    )
    image = models.ImageField(upload_to='event_gallery/')
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ['order']
        verbose_name = 'Event Image'
        verbose_name_plural = 'Event Images'

    def __str__(self):
        return f"{self.event.title} - Gallery Image {self.order}"
