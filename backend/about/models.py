from django.conf import settings
from django.db import models


class AboutSection(models.Model):
    class SectionType(models.TextChoices):
        MISSION = 'MISSION', 'Mission'
        VISION = 'VISION', 'Vision'
        GOALS = 'GOALS', 'Goals'
        HISTORY = 'HISTORY', 'History'
        CONSTITUTION = 'CONSTITUTION', 'Constitution & By-Laws'
        RESOLUTION = 'RESOLUTION', 'Resolution'
        CUSTOM = 'CUSTOM', 'Custom'

    section_type = models.CharField(
        max_length=20,
        choices=SectionType.choices,
        default=SectionType.CUSTOM,
    )
    title = models.CharField(max_length=200)
    body = models.TextField(blank=True, default='')
    document = models.FileField(upload_to='org_documents/', blank=True)
    document_name = models.CharField(max_length=255, blank=True, default='')
    is_published = models.BooleanField(default=True)
    display_order = models.PositiveIntegerField(default=0, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='about_sections',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'created_at']
        verbose_name = 'About Section'
        verbose_name_plural = 'About Sections'

    def __str__(self):
        return self.title
