import re
import secrets
import string
from datetime import date as _date

from django.conf import settings
from django.db import models


def normalize_event_key(event_name, event_date):
    """Build a stable key for an event so the same typed event is recognized.

    Certificates do not attach to a real Event entity (none exists in the
    portal), so duplicates are detected by a normalized event name + date.
    """
    name = re.sub(r'\s+', ' ', (event_name or '').strip().lower())
    if isinstance(event_date, _date):
        date_part = event_date.isoformat()
    else:
        date_part = str(event_date or '')
    return f'{name}|{date_part}'


class CertificateDesign(models.Model):
    """A reusable certificate template.

    Background/signature images are stored through the default storage
    (Cloudinary in production). PDFs are never stored; they are rendered on
    demand from this design plus each certificate's frozen snapshot.
    """

    class Preset(models.TextChoices):
        CLASSIC = 'CLASSIC', 'Classic'
        MODERN = 'MODERN', 'Modern'
        ELEGANT = 'ELEGANT', 'Elegant'
        MINIMAL = 'MINIMAL', 'Minimal'
        UPLOAD = 'UPLOAD', 'Custom Upload'

    class Alignment(models.TextChoices):
        LEFT = 'LEFT', 'Left'
        CENTER = 'CENTER', 'Center'
        RIGHT = 'RIGHT', 'Right'

    name = models.CharField(max_length=150)
    preset = models.CharField(max_length=20, choices=Preset.choices, default=Preset.CLASSIC)
    text_align = models.CharField(
        max_length=6, choices=Alignment.choices, default=Alignment.CENTER
    )
    background_image = models.ImageField(
        upload_to='certificate_backgrounds/', null=True, blank=True, max_length=500
    )
    title = models.CharField(max_length=200, default='Certificate of Participation')
    message = models.TextField(blank=True, default='')
    signatory_name = models.CharField(max_length=150, blank=True, default='')
    signatory_position = models.CharField(max_length=150, blank=True, default='')
    signature_image = models.ImageField(
        upload_to='certificate_signatures/', null=True, blank=True, max_length=500
    )
    second_signatory_name = models.CharField(max_length=150, blank=True, default='')
    second_signatory_position = models.CharField(max_length=150, blank=True, default='')
    text_color = models.CharField(max_length=20, default='#0f172a')
    font_size = models.PositiveSmallIntegerField(default=16)
    is_archived = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificate_designs',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Certificate Design'
        verbose_name_plural = 'Certificate Designs'

    def __str__(self):
        return self.name

    def snapshot(self):
        """Freeze the wording/style so later edits don't change issued certs."""
        return {
            'preset': self.preset,
            'title': self.title,
            'message': self.message,
            'signatory_name': self.signatory_name,
            'signatory_position': self.signatory_position,
            'second_signatory_name': self.second_signatory_name,
            'second_signatory_position': self.second_signatory_position,
            'text_color': self.text_color,
            'font_size': self.font_size,
            'text_align': self.text_align,
            'background_url': self.background_image.url if self.background_image else '',
            'signature_url': self.signature_image.url if self.signature_image else '',
        }


def generate_verification_code():
    """Return a unique, human-friendly verification code."""
    alphabet = string.ascii_uppercase + string.digits
    while True:
        code = 'ICPEP-' + ''.join(secrets.choice(alphabet) for _ in range(10))
        if not Certificate.objects.filter(verification_code=code).exists():
            return code


class Certificate(models.Model):
    """One certificate issued to one member for one event."""

    class Status(models.TextChoices):
        ISSUED = 'ISSUED', 'Issued'
        REVOKED = 'REVOKED', 'Revoked'

    member = models.ForeignKey(
        'members.MemberProfile', on_delete=models.CASCADE, related_name='certificates'
    )
    design = models.ForeignKey(
        CertificateDesign,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='certificates',
    )
    # Frozen copy of the design (wording, style, resolved image URLs) at issue
    # time, so editing or deleting the design later never alters issued certs.
    design_snapshot = models.JSONField(default=dict, blank=True)
    event_name = models.CharField(max_length=200)
    event_date = models.DateField()
    event_key = models.CharField(max_length=255, db_index=True)
    verification_code = models.CharField(max_length=24, unique=True, db_index=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ISSUED)
    issued_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='issued_certificates',
    )
    issued_at = models.DateTimeField(auto_now_add=True)
    seen_at = models.DateTimeField(null=True, blank=True)
    revoked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='revoked_certificates',
    )
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-issued_at']
        indexes = [models.Index(fields=['member', 'event_key'])]
        verbose_name = 'Certificate'
        verbose_name_plural = 'Certificates'

    def __str__(self):
        return f'{self.event_name} — {self.member}'
