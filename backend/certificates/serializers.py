import contextlib
import json
from uuid import uuid4

from django.conf import settings
from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from rest_framework import serializers

from members.models import MemberProfile
from members.serializers import validate_image_file

from .imaging import strip_light_background
from .models import Certificate, CertificateDesign


def _resolve_cloudinary_url(url, field_instance):
    """Match the members serializers' Cloudinary URL resolution convention."""
    if not url or 'res.cloudinary.com' in url:
        return url
    cld = getattr(settings, 'CLOUDINARY_STORAGE', None)
    if cld:
        cloud_name = cld.get('CLOUD_NAME', '')
        if cloud_name:
            path = str(field_instance).lstrip('/')
            if path.startswith('media/'):
                path = path[6:]
            return f'https://res.cloudinary.com/{cloud_name}/image/upload/v1/{path}'
    return url


class FlexibleJSONField(serializers.Field):
    """Accepts either a JSON string (multipart) or an already-decoded value."""

    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                return json.loads(data)
            except (ValueError, TypeError):
                raise serializers.ValidationError('Invalid JSON.') from None
        return data

    def to_representation(self, value):
        return value


class CertificateDesignSerializer(serializers.ModelSerializer):
    background_image = serializers.ImageField(
        required=False, allow_null=True, validators=[validate_image_file]
    )
    signatories = FlexibleJSONField(required=False)
    certificate_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CertificateDesign
        fields = [
            'id', 'name', 'preset', 'background_image', 'title', 'message',
            'presented_to_text', 'for_text',
            'header_school', 'header_college', 'header_organization',
            'signatories', 'text_color', 'qr_color', 'font_size', 'text_align',
            'is_archived', 'certificate_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_archived', 'created_at', 'updated_at']

    def get_certificate_count(self, obj):
        return obj.certificates.count()

    def validate_signatories(self, value):
        if value in (None, ''):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError('Signatories must be a list.')
        cleaned = []
        for item in value:
            if not isinstance(item, dict):
                continue
            name = str(item.get('name') or '').strip()[:150]
            position = str(item.get('position') or '').strip()[:150]
            url = str(item.get('signature_url') or '').strip()
            if not (name or position or url):
                continue
            cleaned.append({'name': name, 'position': position, 'signature_url': url})
        return cleaned

    def validate(self, attrs):
        request = self.context.get('request')
        if request:
            for key, uploaded in request.FILES.items():
                if key.startswith('signature_'):
                    try:
                        validate_image_file(uploaded)
                    except DjangoValidationError as exc:
                        raise serializers.ValidationError({key: exc.messages}) from exc
        return attrs

    def _apply_signature_uploads(self, instance):
        request = self.context.get('request')
        if not request:
            return instance
        signatories = list(instance.signatories or [])
        updated = False
        for key, uploaded in request.FILES.items():
            if not key.startswith('signature_'):
                continue
            try:
                index = int(key[len('signature_'):])
            except (ValueError, TypeError):
                continue
            if index < 0 or index >= len(signatories):
                continue
            safe_name = uploaded.name.replace('\\', '/').split('/')[-1]
            with contextlib.suppress(AttributeError, ValueError):
                uploaded.seek(0)
            raw = uploaded.read()
            cleaned = strip_light_background(raw)
            if cleaned:
                stored = default_storage.save(
                    f'certificate_signatures/{uuid4().hex}.png', ContentFile(cleaned)
                )
            else:
                stored = default_storage.save(
                    f'certificate_signatures/{uuid4().hex}_{safe_name}',
                    ContentFile(raw),
                )
            signatories[index]['signature_url'] = default_storage.url(stored)
            updated = True
        if updated:
            instance.signatories = signatories
            instance.save(update_fields=['signatories'])
        return instance

    def create(self, validated_data):
        return self._apply_signature_uploads(super().create(validated_data))

    def update(self, instance, validated_data):
        return self._apply_signature_uploads(super().update(instance, validated_data))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        val = data.get('background_image')
        if val:
            data['background_image'] = _resolve_cloudinary_url(
                val, getattr(instance, 'background_image', None)
            )
        for entry in data.get('signatories') or []:
            if entry.get('signature_url'):
                entry['signature_url'] = _resolve_cloudinary_url(
                    entry['signature_url'], entry['signature_url']
                )
        return data


class CertificateSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    design_name = serializers.SerializerMethodField()
    is_new = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'id', 'member', 'member_name', 'design', 'design_name',
            'event_name', 'event_date', 'event_venue', 'issued_at', 'status',
            'verification_code', 'is_new', 'seen_at',
        ]

    def get_member_name(self, obj):
        member = obj.member
        parts = [member.first_name, member.middle_name, member.last_name]
        return ' '.join(p for p in parts if p) or '—'

    def get_design_name(self, obj):
        if obj.design_id and obj.design:
            return obj.design.name
        return (obj.design_snapshot or {}).get('title', '') or ''

    def get_is_new(self, obj):
        return obj.status == Certificate.Status.ISSUED and obj.seen_at is None


class CertificateCandidateSerializer(serializers.ModelSerializer):
    """A selectable member in the 'who gets a certificate' picker."""

    full_name = serializers.SerializerMethodField()
    user_email = serializers.CharField(source='user.email', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    already_issued = serializers.SerializerMethodField()
    certificate_id = serializers.SerializerMethodField()

    class Meta:
        model = MemberProfile
        fields = [
            'id', 'full_name', 'first_name', 'middle_name', 'last_name',
            'student_number', 'course', 'year_level', 'section',
            'user_email', 'username', 'already_issued', 'certificate_id',
        ]

    def get_full_name(self, obj):
        parts = [obj.first_name, obj.middle_name, obj.last_name]
        return ' '.join(p for p in parts if p) or '—'

    def get_already_issued(self, obj):
        return obj.id in (self.context.get('issued_member_ids') or set())

    def get_certificate_id(self, obj):
        return (self.context.get('issued_cert_map') or {}).get(obj.id)


class CertificateIssueSerializer(serializers.Serializer):
    design = serializers.IntegerField()
    event_name = serializers.CharField(max_length=200)
    event_date = serializers.DateField()
    event_venue = serializers.CharField(
        max_length=300, required=False, allow_blank=True, default=''
    )
    member_ids = serializers.ListField(
        child=serializers.IntegerField(), allow_empty=False
    )

    def validate_design(self, value):
        if not CertificateDesign.objects.filter(pk=value).exists():
            raise serializers.ValidationError('Certificate design not found.')
        return value

    def validate_event_name(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Event name is required.')
        return value
