from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


class OfficerRosterSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    username = serializers.CharField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    position = serializers.CharField(allow_blank=True)
    profile_picture = serializers.CharField(allow_null=True)

    @staticmethod
    def _profile_picture_url(profile_picture):
        if not profile_picture:
            return None
        try:
            url = profile_picture.url
        except Exception:
            url = str(profile_picture)

        # cache bust using updated_at when possible
        try:
            ts = int(getattr(profile_picture, 'updated_at', None) or timezone.now().timestamp())
        except Exception:
            ts = int(timezone.now().timestamp())
        return f"{url}?v={ts}"

    @classmethod
    def from_user(cls, user):
        return {
            'user_id': user.id,
            'username': getattr(user, 'username', ''),
            'first_name': getattr(user, 'first_name', '') or '',
            'last_name': getattr(user, 'last_name', '') or '',
            'position': getattr(user, 'position', '') or '',
            'profile_picture': cls._profile_picture_url(getattr(user, 'profile_picture', None)),
        }

