from django.contrib.auth import get_user_model
from rest_framework import serializers

from members.models import MemberProfile

User = get_user_model()


class AdminRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'confirm_password',
            'first_name', 'last_name', 'position', 'department',
            'academic_year', 'admin_note', 'profile_picture',
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        if User.objects.filter(email__iexact=data['email']).exists():
            raise serializers.ValidationError({'email': 'An account with this email already exists.'})
        if User.objects.filter(username__iexact=data['username']).exists():
            raise serializers.ValidationError({'username': 'An account with this username already exists.'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        password = validated_data.pop('password')
        profile_picture = validated_data.pop('profile_picture', None)
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role='ADMIN',
            position='',
            department=validated_data.get('department', ''),
            academic_year=validated_data.get('academic_year', ''),
            requested_position=validated_data.get('position', ''),
            requested_department=validated_data.get('department', ''),
            requested_academic_year=validated_data.get('academic_year', ''),
            admin_note=validated_data.get('admin_note', ''),
            registration_status='PENDING',
            access_level='RESTRICTED',
            is_active=False,
        )
        if profile_picture is not None:
            user.profile_picture = profile_picture
            user.save(update_fields=['profile_picture'])
        return user


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
    membership_fee     = serializers.ChoiceField(choices=[('SEMESTER', '₱25 — 1 Semester'), ('ANNUAL', '₱50 — 1 Academic Year')], default='SEMESTER')
    profile_picture     = serializers.ImageField(required=False, allow_null=True)
    payment_proof_image = serializers.ImageField(required=False, allow_null=True)
    coe_id_image = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model  = User
        fields = [
            'email', 'username', 'password', 'confirm_password',
            'first_name', 'middle_name', 'last_name',
            'student_number', 'course', 'year_level', 'section', 'contact_number',
            'payment_method', 'membership_fee', 'profile_picture', 'payment_proof_image', 'coe_id_image',
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def validate_coe_id_image(self, value):
        if value:
            if value.size > 10 * 1024 * 1024:
                raise serializers.ValidationError('File size must not exceed 10MB.')
            allowed_types = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError('Only JPG, PNG, and PDF files are allowed.')
        return value

    def create(self, validated_data):
        profile_fields = {
            'first_name':          validated_data.pop('first_name'),
            'middle_name':         validated_data.pop('middle_name', ''),
            'last_name':           validated_data.pop('last_name'),
            'student_number':      validated_data.pop('student_number'),
            'course':              validated_data.pop('course'),
            'year_level':          validated_data.pop('year_level'),
            'section':             validated_data.pop('section'),
            'contact_number':      validated_data.pop('contact_number'),
            'payment_method':      validated_data.pop('payment_method', 'ON_HAND'),
            'membership_fee':      validated_data.pop('membership_fee', 'SEMESTER'),
            'profile_picture':     validated_data.pop('profile_picture', None),
            'payment_proof_image': validated_data.pop('payment_proof_image', None),
            'coe_id_image':        validated_data.pop('coe_id_image', None),
        }
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        MemberProfile.objects.create(user=user, **profile_fields)
        return user

    def validate_profile_picture(self, value):
        from members.serializers import validate_image_file
        return validate_image_file(value)

    def validate_payment_proof_image(self, value):
        from members.serializers import validate_image_file
        return validate_image_file(value)


class UserSerializer(serializers.ModelSerializer):
    """Used in auth responses + /me endpoint."""
    role             = serializers.SerializerMethodField()
    position         = serializers.SerializerMethodField()
    is_term_expired  = serializers.SerializerMethodField()
    is_term_active   = serializers.SerializerMethodField()
    can_manage_roles = serializers.SerializerMethodField()
    membership_status = serializers.SerializerMethodField()
    admin_message     = serializers.SerializerMethodField()
    profile_picture   = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'username', 'role', 'position',
            'is_term_active', 'is_term_expired', 'can_manage_roles',
            'membership_status', 'admin_message', 'profile_picture',
            'registration_status', 'access_level', 'requested_position',
            'requested_department', 'requested_academic_year', 'admin_note',
            'created_at',
        ]

    def get_role(self, obj):
        return getattr(obj, 'role', 'ADMIN' if getattr(obj, 'is_staff', False) or getattr(obj, 'is_superuser', False) else 'MEMBER')

    def get_position(self, obj):
        return getattr(obj, 'position', 'NONE')

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

    def get_admin_message(self, obj):
        profile = getattr(obj, 'profile', None)
        return getattr(profile, 'admin_message', None)

    def get_profile_picture(self, obj):
        try:
            if hasattr(obj, 'profile_picture') and obj.profile_picture:
                url = obj.profile_picture.url if hasattr(obj.profile_picture, 'url') else str(obj.profile_picture)
                if url and 'res.cloudinary.com' not in url:
                    from django.conf import settings
                    cld = getattr(settings, 'CLOUDINARY_STORAGE', None)
                    if cld:
                        cloud_name = cld.get('CLOUD_NAME', '')
                        if cloud_name:
                            path = str(obj.profile_picture).lstrip('/')
                            # Strip old /media/ prefix if present
                            if path.startswith('media/'):
                                path = path[6:]
                            return f'https://res.cloudinary.com/{cloud_name}/image/upload/v1/{path}'
                return url
        except Exception:
            pass
        return None


class AdminLoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        from django.contrib.auth import authenticate
        email = data.get('email', '')
        password = data.get('password', '')

        if not User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('No account found with this email.')

        user = authenticate(email=email, password=password)

        if not user:
            # authenticate() returns None for inactive users even if password is correct
            try:
                inactive_user = User.objects.get(email__iexact=email)
                if inactive_user.check_password(password):
                    status = getattr(inactive_user, 'registration_status', 'APPROVED')
                    if status == 'PENDING':
                        raise serializers.ValidationError('Your admin request is still pending approval.')
                    if status == 'REJECTED':
                        raise serializers.ValidationError('Your admin request was rejected. Please contact the President.')
                    if not inactive_user.is_active:
                        raise serializers.ValidationError('This account is disabled.')
                raise serializers.ValidationError('Incorrect password.')
            except User.DoesNotExist:
                raise serializers.ValidationError('Incorrect password.') from None

        if hasattr(user, 'role'):
            if user.role != 'ADMIN':
                raise serializers.ValidationError(
                    'Access denied. This portal is for administrators only.'
                )
            if getattr(user, 'registration_status', 'APPROVED') == 'PENDING':
                raise serializers.ValidationError('Your admin request is still pending approval.')
            if getattr(user, 'registration_status', 'APPROVED') == 'REJECTED':
                raise serializers.ValidationError('Your admin request was rejected. Please contact the President.')
            if user.position == 'NONE':
                raise serializers.ValidationError(
                    'Your term has ended. Contact the current President to be re-assigned.'
                )

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
