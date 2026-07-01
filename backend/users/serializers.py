import os

from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


def _safe_profile_picture_url(field, request=None):
    """
    Returns the Cloudinary URL as-is, or constructs an absolute local URL.
    NEVER appends ?v= cache-busting — Cloudinary 404s on unknown query params.
    """
    try:
        if field and field.name:
            url = field.url
            # Cloudinary returns full absolute URLs — return as-is
            if isinstance(url, str) and url.startswith(('http://', 'https://')):
                return url
            # Local storage: make absolute using request
            if request and isinstance(url, str) and url.startswith('/'):
                return request.build_absolute_uri(url)
            # Fallback: public_id only — construct Cloudinary URL
            cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
            if cloud_name and isinstance(url, str):
                return f"https://res.cloudinary.com/{cloud_name}/image/upload/{url}"
            return url
    except (ValueError, AttributeError, Exception):
        pass
    return None


class OfficerRosterSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    fullName = serializers.CharField()
    position = serializers.CharField()
    office = serializers.CharField(allow_blank=True, required=False)
    academicYear = serializers.CharField(allow_blank=True, required=False)
    username = serializers.CharField()
    avatarUrl = serializers.CharField(allow_null=True, required=False)
    isActive = serializers.BooleanField()

    @classmethod
    def from_user(cls, user, request=None):
        first_name = getattr(user, 'first_name', '') or ''
        last_name = getattr(user, 'last_name', '') or ''
        full_name = f"{first_name} {last_name}".strip() or getattr(user, 'username', '')

        position = getattr(user, 'position', '') or ''
        department = getattr(user, 'department', '') or ''
        academic_year = getattr(user, 'academic_year', '') or ''
        username = getattr(user, 'username', '') or ''
        is_active = getattr(user, 'is_active', True)

        avatar_url = None
        pic = getattr(user, 'profile_picture', None)
        if pic and getattr(pic, 'name', None):
            try:
                url = pic.url
                # Cloudinary returns full absolute URL — use as-is
                if isinstance(url, str) and url.startswith(('http://', 'https://')):
                    avatar_url = url
                # Local storage — make absolute
                elif request and isinstance(url, str) and url.startswith('/'):
                    avatar_url = request.build_absolute_uri(url)
                else:
                    # Fallback: construct Cloudinary URL from public_id
                    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
                    if cloud_name and isinstance(url, str):
                        avatar_url = f"https://res.cloudinary.com/{cloud_name}/image/upload/{url}"
                    else:
                        avatar_url = url
            except Exception:
                avatar_url = None

        return {
            'id': user.id,
            'fullName': full_name,
            'position': position,
            'office': department,
            'academicYear': academic_year,
            'username': username,
            'avatarUrl': avatar_url,
            'isActive': is_active,
        }


class UserListSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        return _safe_profile_picture_url(obj.profile_picture, request=request)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'position', 'is_delegated', 'is_active',
            'year_level', 'created_at', 'profile_picture',
            'department', 'academic_year',
        ]
        read_only_fields = ['id', 'created_at']


class AdminProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    def get_profile_picture(self, obj):
        request = self.context.get('request')
        return _safe_profile_picture_url(getattr(obj, 'profile_picture', None), request=request)

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
            'department',
            'academic_year',
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
            'department', 'academic_year',
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

        # Clamp strings to avoid Postgres varchar DataError
        for attr, value in list(validated_data.items()):
            if value is None:
                continue
            if isinstance(value, str):
                if attr == 'academic_year':
                    validated_data[attr] = value[:20]
                else:
                    validated_data[attr] = value[:100]

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        if profile_picture is not None:
            instance.profile_picture = profile_picture

        instance.save()
        return instance


class AssignRoleSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=User.Role.choices)
    # NOTE: positions are dynamic (free text) — there is no User.Position
    # choices class on the model, so this must be a CharField, not ChoiceField.
    position = serializers.CharField(max_length=100, allow_blank=True, required=False)
    is_delegated = serializers.BooleanField(default=False)

    def validate(self, attrs):
        if attrs.get('position', '').lower() == 'president':
            # Add extra validation if needed, handled in views mostly
            pass
        return attrs


class DelegateSecretarySerializer(serializers.Serializer):
    is_delegated = serializers.BooleanField()


class OfficerCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    # NOTE: positions are dynamic (free text) — there is no User.Position
    # choices class on the model, so this must be a CharField, not ChoiceField.
    position = serializers.CharField(max_length=100, allow_blank=True, required=False)
    department = serializers.CharField(max_length=100, allow_blank=True, required=False)
    academic_year = serializers.CharField(max_length=20, allow_blank=True, required=False)
