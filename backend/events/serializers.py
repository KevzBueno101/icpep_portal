from rest_framework import serializers
from .models import Event, EventImage


class EventImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True, required=False)

    class Meta:
        model = EventImage
        fields = ['id', 'image', 'order']


class EventSerializer(serializers.ModelSerializer):
    banner_image = serializers.ImageField(use_url=True, required=False)
    organizer_logo = serializers.ImageField(use_url=True, required=False)
    gallery_images = EventImageSerializer(many=True, read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'description', 'content', 'banner_image',
            'date', 'location', 'is_online', 'meeting_link',
            'organizer_name', 'organizer_logo', 'tags',
            'registration_status', 'is_featured', 'display_order',
            'gallery_images', 'created_at', 'updated_at'
        ]
