from django.conf import settings
from rest_framework import serializers

from members.models import MemberProfile
from members.serializers import validate_image_file

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


class CertificateDesignSerializer(serializers.ModelSerializer):
    background_image = serializers.ImageField(
        required=False, allow_null=True, validators=[validate_image_file]
    )
    signature_image = serializers.ImageField(
        required=False, allow_null=True, validators=[validate_image_file]
    )
    certificate_count = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = CertificateDesign
        fields = [
            'id', 'name', 'preset', 'background_image', 'title', 'message',
            'signatory_name', 'signatory_position', 'signature_image',
            'second_signatory_name', 'second_signatory_position',
            'text_color', 'font_size', 'is_archived', 'certificate_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_archived', 'created_at', 'updated_at']

    def get_certificate_count(self, obj):
        return obj.certificates.count()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for field_name in ('background_image', 'signature_image'):
            val = data.get(field_name)
            if val:
                f_instance = getattr(instance, field_name, None)
                data[field_name] = _resolve_cloudinary_url(val, f_instance)
        return data


class CertificateSerializer(serializers.ModelSerializer):
    member_name = serializers.SerializerMethodField()
    design_name = serializers.SerializerMethodField()
    is_new = serializers.SerializerMethodField()

    class Meta:
        model = Certificate
        fields = [
            'id', 'member', 'member_name', 'design', 'design_name',
            'event_name', 'event_date', 'issued_at', 'status',
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
