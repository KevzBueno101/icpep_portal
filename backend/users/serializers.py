from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


def _safe_profile_picture_url(field):
    """Returns URL string or None — never crashes on missing/broken files."""
    try:
        if field and field.name:
            return field.url
    except (ValueError, AttributeError):
        pass
    return None


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


class UserListSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    def get_profile_picture(self, obj):
        return _safe_profile_picture_url(obj.profile_picture)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'position', 'is_delegated', 'is_active',
            'year_level', 'created_at', 'profile_picture',
        ]
        read_only_fields = ['id', 'created_at']


class AdminProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    def get_profile_picture(self, obj):
        return _safe_profile_picture_url(getattr(obj, 'profile_picture', None))

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'role',
            'position',
            'is_delegated',
            'is_active',
            'profile_picture',
            'can_manage_roles',
        ]
        read_only_fields = ['id', 'role', 'position', 'can_manage_roles']


class AdminAccountSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=False, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'position', 'is_delegated', 'is_active',
            'year_level', 'profile_picture', 'password',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        if not self.instance and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'Password is required for new accounts.'})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        profile_picture = validated_data.pop('profile_picture', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        if profile_picture is not None:
            instance.profile_picture = profile_picture

        instance.save()
        return instance