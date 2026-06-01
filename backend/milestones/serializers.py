from rest_framework import serializers
from .models import Milestone, MilestoneImage


class MilestoneImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(use_url=True)

    class Meta:
        model = MilestoneImage
        fields = ['id', 'image', 'order']


class MilestoneListSerializer(serializers.ModelSerializer):
    """For public timeline - shows headline, description, date, category, first image"""
    first_image = serializers.SerializerMethodField()
    date_display = serializers.CharField(source='date', read_only=True)

    class Meta:
        model = Milestone
        fields = ['id', 'headline', 'description', 'date', 'date_display', 'category', 'first_image']

    def get_first_image(self, obj):
        first_image = obj.images.first()
        if first_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(first_image.image.url)
            return first_image.image.url
        return None


class MilestoneDetailSerializer(serializers.ModelSerializer):
    """For public detail page - shows all fields and all images"""
    images = MilestoneImageSerializer(many=True, read_only=True)
    date_display = serializers.CharField(source='date', read_only=True)

    class Meta:
        model = Milestone
        fields = ['id', 'title', 'headline', 'description', 'content', 'date', 'date_display', 'category', 'images', 'created_at', 'updated_at']


class MilestoneCreateUpdateSerializer(serializers.ModelSerializer):
    """For admin CRUD operations"""
    images = MilestoneImageSerializer(many=True, read_only=True)

    class Meta:
        model = Milestone
        fields = ['id', 'title', 'headline', 'description', 'content', 'date', 'category', 'images']
