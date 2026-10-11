from rest_framework import serializers

from .models import Announcement, AnnouncementImage


class AnnouncementImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = AnnouncementImage
        fields = ['id', 'image', 'order']


class AnnouncementSerializer(serializers.ModelSerializer):
    images = AnnouncementImageSerializer(many=True, read_only=True)
    first_image = serializers.SerializerMethodField()

    class Meta:
        model = Announcement
        fields = [
            'id',
            'title',
            'body',
            'category',
            'tags',
            'author',
            'pinned',
            'is_published',
            'members_only',
            'event_date_start',
            'event_date_end',
            'event_time_start',
            'event_time_end',
            'location',
            'email_blast_sent_at',
            'images',
            'first_image',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at', 'email_blast_sent_at']

    def get_first_image(self, obj):
        first_image = obj.images.first()
        if first_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        return None

    def validate(self, attrs):
        # Log incoming data for debugging
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Announcement validation data: {attrs}")

        # Check for empty strings in optional fields and convert to None
        optional_fields = ['tags', 'author', 'location']
        for field in optional_fields:
            if field in attrs and attrs[field] == '':
                attrs[field] = None

        return attrs
