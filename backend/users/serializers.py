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
                if request:
                    avatar_url = request.build_absolute_uri(url)
                else:
                    avatar_url = f"http://127.0.0.1:8000{url}" if url.startswith('/') else url
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
        return _safe_profile_picture_url(obj.profile_picture)

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

        # Prevent DB DataError: character varying(max_length) when UI sends long strings.
        # User model constraints:
        # - position: max_length=100
        # - department: max_length=100
        for attr, value in list(validated_data.items()):
            if value is None:
                continue
            if attr in {'position', 'department'} and isinstance(value, str):
                # Safety clamp for Postgres varchar(100)
                validated_data[attr] = value[:100]

        # Also clamp academic_year defensively in case DB differs by migration.
        if 'academic_year' in validated_data and isinstance(validated_data.get('academic_year'), str):
            validated_data['academic_year'] = validated_data['academic_year'][:20]


        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        if profile_picture is not None:
            instance.profile_picture = profile_picture

        instance.save()
        return instance

