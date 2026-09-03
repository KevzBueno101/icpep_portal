from rest_framework import serializers

from .models import AboutSection


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
        if request:
            return request.build_absolute_uri(obj.document.url)
        return obj.document.url
