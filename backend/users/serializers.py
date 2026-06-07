from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
# backend/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class AdminProfileSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()
    current_password = serializers.CharField(write_only=True, required=False)
    new_password = serializers.CharField(write_only=True, required=False, min_length=8)
    confirm_password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'role',
            'position',
            'profile_picture',
            'is_staff',
            'is_superuser',
            'current_password',
            'new_password',
            'confirm_password',
        )
        read_only_fields = (
            'id',
            'is_staff',
            'is_superuser',
        )
        extra_kwargs = {
            'first_name': {
                'required': False,
                'allow_blank': True,
                'max_length': 150,
            },
            'last_name': {
                'required': False,
                'allow_blank': True,
                'max_length': 150,
            },
            'email': {
                'required': False,
            },
            'username': {
                'required': False,
            },
            'role': {
                'required': False,
            },
            'position': {
                'required': False,
            },
        }

    def validate_first_name(self, value):
        # Allow blank (empty string) but enforce max length
        if value is None:
            return value
        if len(value) > 150:
            raise serializers.ValidationError('first_name must be at most 150 characters.')
        return value

    def validate_last_name(self, value):
        # Allow blank (empty string) but enforce max length
        if value is None:
            return value
        if len(value) > 150:
            raise serializers.ValidationError('last_name must be at most 150 characters.')
        return value

    def validate_email(self, value):
        # Check uniqueness if email is being changed
        if self.instance and value != self.instance.email:
            existing = User.objects.filter(email=value)
            if existing.exists():
                raise serializers.ValidationError('This email is already registered.')
        return value

    def get_profile_picture(self, obj):
        if hasattr(obj, 'profile_picture') and obj.profile_picture:
            url = obj.profile_picture.url if hasattr(obj.profile_picture, 'url') else str(obj.profile_picture)
            # Add cache-busting timestamp
            import time
            timestamp = int(obj.updated_at.timestamp())
            return f"{url}?v={timestamp}"
        return None

    def validate_username(self, value):
        # Check uniqueness if username is being changed
        if self.instance and value != self.instance.username:
            existing = User.objects.filter(username=value)
            if existing.exists():
                raise serializers.ValidationError('This username is already taken.')
        return value

    def validate(self, data):
        # Password change validation
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        confirm_password = data.get('confirm_password')

        if new_password or confirm_password:
            if not current_password:
                raise serializers.ValidationError('Current password is required to change password.')
            if new_password != confirm_password:
                raise serializers.ValidationError('New password and confirm password do not match.')
            if not self.instance.check_password(current_password):
                raise serializers.ValidationError('Current password is incorrect.')

        return data

    def update(self, instance, validated_data):
        # Remove password fields from validated_data before updating the instance
        current_password = validated_data.pop('current_password', None)
        new_password = validated_data.pop('new_password', None)
        confirm_password = validated_data.pop('confirm_password', None)

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Handle password change
        if new_password:
            instance.set_password(new_password)

        instance.save()
        return instance


User = get_user_model()

ROLE_CHOICES = [
    ('ADMIN',   'Admin'),
    ('OFFICER', 'Officer'),
]


class UserListSerializer(serializers.ModelSerializer):
    """For listing admin accounts with term info."""
    is_term_expired  = serializers.BooleanField(read_only=True)
    is_term_active   = serializers.BooleanField(read_only=True)
    can_manage_roles = serializers.BooleanField(read_only=True)
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'username', 'role', 'position',
            'is_delegated', 'term_start', 'profile_picture', 'year_level',
            'is_term_active', 'is_term_expired', 'can_manage_roles',
            'is_active', 'created_at',
        ]
        read_only_fields = fields
    def get_profile_picture(self, obj):
        if hasattr(obj, 'profile_picture') and obj.profile_picture:
            url = obj.profile_picture.url if hasattr(obj.profile_picture, 'url') else str(obj.profile_picture)
            # Add timestamp to force browser to reload new image
            import time
            timestamp = int(obj.updated_at.timestamp())
            return f"{url}?v={timestamp}"
        return None
        


class AssignRoleSerializer(serializers.Serializer):
    """Payload for assigning a role/position to a user."""
    role         = serializers.ChoiceField(choices=ROLE_CHOICES)
    position     = serializers.CharField(max_length=100, required=False, allow_blank=True)
    is_delegated = serializers.BooleanField(default=False)

    def validate(self, data):
        requester = self.context['requester']

        if not requester.can_manage_roles:
            raise serializers.ValidationError(
                'You do not have permission to assign roles.'
            )

        return data


class DelegateSecretarySerializer(serializers.Serializer):
    """Toggle delegation for a Secretary account."""
    is_delegated = serializers.BooleanField()


class AdminAccountSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'role', 'position', 'is_delegated',
            'is_active', 'term_start', 'created_at', 'updated_at', 'password',
            'is_term_active', 'is_term_expired', 'can_manage_roles', 'profile_picture', 'year_level',
        ]
        read_only_fields = [
            'id', 'term_start', 'created_at', 'updated_at',
            'is_term_active', 'is_term_expired', 'can_manage_roles',
        ]

    def validate_email(self, value):
        existing = User.objects.filter(email=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError('This email is already registered.')
        return value

    def validate_username(self, value):
        existing = User.objects.filter(username=value)
        if self.instance:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError('This username is already taken.')
        return value

    def validate(self, data):
        requester = self.context['requester']
        if not requester.can_manage_roles:
            raise serializers.ValidationError('You do not have permission to manage admin accounts.')

        position = data.get('position', getattr(self.instance, 'position', ''))

        position_lower = position.lower() if position else ''
        if 'secretary' not in position_lower and data.get('is_delegated', getattr(self.instance, 'is_delegated', False)):
            data['is_delegated'] = False

        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['is_staff'] = True
        validated_data['term_start'] = timezone.now().date() if validated_data.get('position') else None
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save(update_fields=['password'])
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if 'position' in validated_data:
            position_lower = validated_data['position'].lower() if validated_data['position'] else ''
            if 'secretary' not in position_lower:
                validated_data['is_delegated'] = False

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        if 'position' in validated_data:
            instance.term_start = timezone.now().date() if instance.position else None

        instance.save()
        return instance


class OfficerCreateSerializer(AdminAccountSerializer):
    """Create a new ADMIN-role officer (President/Treasurer/Secretary)."""

    class Meta(AdminAccountSerializer.Meta):
        read_only_fields = [
            'id', 'term_start', 'created_at', 'updated_at',
            'is_term_active', 'is_term_expired', 'can_manage_roles',
        ]

    def validate(self, data):
        requester = self.context['requester']
        if requester.position != 'PRESIDENT':
            raise serializers.ValidationError('Only the President can create officer accounts.')

        if data.get('role') != 'ADMIN':
            raise serializers.ValidationError('Only ADMIN-role officers can be created here.')

        if data.get('position') == 'NONE' and data.get('is_delegated', False):
            raise serializers.ValidationError('is_delegated is only valid when position is SECRETARY.')

        return super().validate(data)
