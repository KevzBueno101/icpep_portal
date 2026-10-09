from rest_framework import serializers
from .models import FeaturedContent


class FeaturedContentSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True, required=False)

    class Meta:
        model = FeaturedContent
        fields = ['id', 'title', 'description', 'image', 'link', 'display_order', 'is_active', 'created_at', 'updated_at']
