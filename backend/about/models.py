from django.conf import settings
from django.db import models


def _document_storage():
    """Storage for about documents — public `raw` Cloudinary in production.

    The Cloudinary account previously delivered these assets with restricted
    auth (401 on plain URLs), so they are intentionally re-uploaded/stored as
    public raw assets that need no signature. In dev (no Cloudinary settings)
    the default local filesystem storage is used.
    """
    if getattr(settings, 'CLOUDINARY_STORAGE', None):
        try:
            from cloudinary_storage.storage import RawMediaCloudinaryStorage
            return RawMediaCloudinaryStorage()
        except ImportError:
            pass
    return None


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
    document = models.FileField(upload_to='org_documents/', blank=True, storage=_document_storage())
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
