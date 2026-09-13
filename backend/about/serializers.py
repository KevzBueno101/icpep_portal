import os

from rest_framework import serializers

from .models import AboutSection

ALLOWED_DOCUMENT_EXTENSIONS = {'.pdf', '.png', '.jpg', '.jpeg'}


class AboutSectionSerializer(serializers.ModelSerializer):
    document_url = serializers.SerializerMethodField()
    section_type_display = serializers.CharField(source='get_section_type_display', read_only=True)

    class Meta:
        model = AboutSection
        fields = [
            'id',
            'section_type',
            'section_type_display',
            'title',
            'body',
            'document',
            'document_name',
            'document_url',
            'is_published',
            'display_order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'document': {'write_only': True},
        }

    def get_document_url(self, obj):
        if not obj.document:
            return None
        request = self.context.get('request')
        url = obj.document.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def validate_document(self, file):
        if file is None:
            return file
        ext = os.path.splitext(file.name or '')[1].lower()
        if ext not in ALLOWED_DOCUMENT_EXTENSIONS:
            raise serializers.ValidationError(
                'Unsupported file type. Only PDF, PNG, JPG, or JPEG files are allowed.'
            )
        content_type = (getattr(file, 'content_type', '') or '').lower()
        if content_type and 'pdf' not in content_type and not content_type.startswith('image/'):
            raise serializers.ValidationError(
                'Unsupported file type. Only PDF, PNG, JPG, or JPEG files are allowed.'
            )
        return file
