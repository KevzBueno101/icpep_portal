from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
# backend/users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email',
                  'position', 'is_staff', 'is_superuser')
        read_only_fields = ('id', 'username', 'email')

User = get_user_model()

ROLE_CHOICES = [
    ('ADMIN',  'Admin'),
    ('MEMBER', 'Member'),
]

POSITION_CHOICES = [
    ('NONE',      'None'),
    ('PRESIDENT', 'President'),
    ('TREASURER', 'Treasurer'),
    ('SECRETARY', 'Secretary'),
]


class UserListSerializer(serializers.ModelSerializer):
    """For listing admin accounts with term info."""
    is_term_expired  = serializers.BooleanField(read_only=True)
    is_term_active   = serializers.BooleanField(read_only=True)
    can_manage_roles = serializers.BooleanField(read_only=True)

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'username', 'role', 'position',
            'is_delegated', 'term_start',
            'is_term_active', 'is_term_expired', 'can_manage_roles',
            'is_active', 'created_at',
        ]
        read_only_fields = fields


class AssignRoleSerializer(serializers.Serializer):
    """Payload for assigning a role/position to a user."""
    role         = serializers.ChoiceField(choices=ROLE_CHOICES)
    position     = serializers.ChoiceField(choices=POSITION_CHOICES)
    is_delegated = serializers.BooleanField(default=False)

    def validate(self, data):
        requester = self.context['requester']

        if not requester.can_manage_roles:
            raise serializers.ValidationError(
                'You do not have permission to assign roles.'
            )

        target_position = data.get('position')

        # Delegated Secretary cannot assign President
        if (
            requester.position == 'SECRETARY'
            and requester.is_delegated
            and target_position == 'PRESIDENT'
        ):
            raise serializers.ValidationError(
                'Secretary cannot assign the President position.'
            )

        # Member role must have NONE position
        if data['role'] == 'MEMBER' and target_position != 'NONE':
            raise serializers.ValidationError(
                'Members cannot have an admin position. Set position to NONE.'
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
            'is_term_active', 'is_term_expired', 'can_manage_roles',
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

        role = data.get('role', getattr(self.instance, 'role', None))
        position = data.get('position', getattr(self.instance, 'position', None))

        if role == 'MEMBER' and position != 'NONE':
            raise serializers.ValidationError('Members cannot have an admin position. Set position to NONE.')

        if position != 'SECRETARY' and data.get('is_delegated', getattr(self.instance, 'is_delegated', False)):
            data['is_delegated'] = False

        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['is_staff'] = True
        validated_data['term_start'] = timezone.now().date() if validated_data.get('position') != 'NONE' else None
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save(update_fields=['password'])
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        if 'position' in validated_data and validated_data['position'] != 'SECRETARY':
            validated_data['is_delegated'] = False

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        if 'position' in validated_data:
            instance.term_start = timezone.now().date() if instance.position != 'NONE' else None

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
