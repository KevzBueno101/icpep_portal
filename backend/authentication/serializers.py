from rest_framework import serializers
from django.contrib.auth import get_user_model
from members.models import MemberProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    first_name         = serializers.CharField()
    last_name          = serializers.CharField()
    middle_name        = serializers.CharField(required=False, allow_blank=True)
    student_number     = serializers.CharField()
    course             = serializers.CharField()
    year_level         = serializers.CharField()
    section            = serializers.CharField()
    contact_number     = serializers.CharField()
    payment_method     = serializers.ChoiceField(choices=[('ON_HAND', 'On-hand / Personal'), ('GCASH', 'GCash')], default='ON_HAND')
    profile_picture     = serializers.ImageField(required=False, allow_null=True)
    payment_proof_image = serializers.ImageField(required=False, allow_null=True)
    coe_id_image = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model  = User
        fields = [
            'email', 'username', 'password', 'confirm_password',
            'first_name', 'middle_name', 'last_name',
            'student_number', 'course', 'year_level', 'section', 'contact_number',
            'payment_method', 'profile_picture', 'payment_proof_image', 'coe_id_image',
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def validate_coe_id_image(self, value):
        if value:
            # Validate file size (max 5MB)
            if value.size > 5 * 1024 * 1024:
                raise serializers.ValidationError('File size must not exceed 5MB.')
            
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError('Only JPG, PNG, and PDF files are allowed.')
        
        return value

    def create(self, validated_data):
        profile_fields = {
            'first_name':         validated_data.pop('first_name'),
            'middle_name':        validated_data.pop('middle_name', ''),
            'last_name':          validated_data.pop('last_name'),
            'student_number':     validated_data.pop('student_number'),
            'course':             validated_data.pop('course'),
            'year_level':         validated_data.pop('year_level'),
            'section':            validated_data.pop('section'),
            'contact_number':     validated_data.pop('contact_number'),
            'payment_method':     validated_data.pop('payment_method', 'ON_HAND'),
            'profile_picture':     validated_data.pop('profile_picture', None),
            'payment_proof_image': validated_data.pop('payment_proof_image', None),
            'coe_id_image':       validated_data.pop('coe_id_image', None),
        }
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        MemberProfile.objects.create(user=user, **profile_fields)
        return user


class UserSerializer(serializers.ModelSerializer):
    """Used in auth responses + /me endpoint."""
    role = serializers.SerializerMethodField()
    position = serializers.SerializerMethodField()
    is_term_expired = serializers.SerializerMethodField()
    is_term_active  = serializers.SerializerMethodField()
    can_manage_roles = serializers.SerializerMethodField()
    membership_status = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'username', 'role', 'position',
            'is_delegated', 'term_start',
            'is_term_active', 'is_term_expired', 'can_manage_roles',
            'membership_status',
            'created_at',
        ]

    def get_role(self, obj):
        return getattr(obj, 'role', 'ADMIN' if getattr(obj, 'is_staff', False) or getattr(obj, 'is_superuser', False) else 'MEMBER')

    def get_position(self, obj):
        return getattr(obj, 'position', 'PRESIDENT' if getattr(obj, 'is_staff', False) or getattr(obj, 'is_superuser', False) else 'NONE')

    def get_is_term_expired(self, obj):
        if hasattr(obj, 'is_term_expired'):
            return obj.is_term_expired
        return False

    def get_is_term_active(self, obj):
        if hasattr(obj, 'is_term_active'):
            return obj.is_term_active
        return getattr(obj, 'position', None) != 'NONE'

    def get_can_manage_roles(self, obj):
        if hasattr(obj, 'can_manage_roles'):
            return obj.can_manage_roles
        return getattr(obj, 'is_staff', False) or getattr(obj, 'is_superuser', False)

    def get_membership_status(self, obj):
        profile = getattr(obj, 'profile', None)
        return getattr(profile, 'membership_status', None)


class AdminLoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        from django.contrib.auth import authenticate
        user = authenticate(email=data['email'], password=data['password'])

        if not user:
            raise serializers.ValidationError('Invalid credentials.')

        if not user.is_active:
            raise serializers.ValidationError('This account is disabled.')

        if hasattr(user, 'role'):
            if user.role != 'ADMIN':
                raise serializers.ValidationError(
                    'Access denied. This portal is for administrators only.'
                )
            if user.position == 'NONE':
                raise serializers.ValidationError(
                    'Your term has ended. Contact the current President to be re-assigned.'
                )
        else:
            if not (user.is_staff or user.is_superuser):
                raise serializers.ValidationError(
                    'Access denied. This portal is for administrators only.'
                )

        data['user'] = user
        return data
