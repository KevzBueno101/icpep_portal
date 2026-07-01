import imghdr

from rest_framework import serializers

from .models import MemberProfile, PaymentSettings

ALLOWED_IMAGE_TYPES = {
    'rgb', 'gif', 'pbm', 'pgm', 'ppm',
    'tiff', 'rast', 'xbm', 'jpeg', 'png', 'webp'
}
MAX_IMAGE_SIZE = 5 * 1024 * 1024  # 5 MB

def validate_image_file(value):
    if value is None:
        return value
    if value.size > MAX_IMAGE_SIZE:
        raise serializers.ValidationError("Max image size is 5 MB.")
    detected = imghdr.what(value)
    if detected not in ALLOWED_IMAGE_TYPES:
        raise serializers.ValidationError(
            "Upload a valid image (JPEG, PNG, GIF, WebP)."
        )
    return value

class MemberProfileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = MemberProfile
        fields = [
            'id', 'user', 'user_email', 'user_role', 'first_name', 'middle_name', 'last_name',
            'student_number', 'course', 'year_level', 'section', 'contact_number', 'address',
            'birthdate', 'profile_picture', 'payment_method', 'payment_proof_image',
            'coe_id_image', 'admin_message', 'membership_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'admin_message', 'membership_status', 'created_at', 'updated_at']


class MemberApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberProfile
        fields = ['membership_status', 'admin_message']


class MemberRenewSerializer(serializers.ModelSerializer):
    payment_proof_image = serializers.ImageField(
        required=True,
        allow_null=False,
        validators=[validate_image_file]
    )
    coe_id_image = serializers.ImageField(
        required=True,
        allow_null=False,
        validators=[validate_image_file]
    )

    class Meta:
        model = MemberProfile
        fields = ['year_level', 'payment_proof_image', 'coe_id_image']


class PaymentSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentSettings
        fields = ['id', 'gcash_number', 'gcash_name']


class MemberCreateSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(write_only=True)

    class Meta:
        model = MemberProfile
        fields = [
            'id', 'user_email', 'first_name', 'middle_name', 'last_name',
            'student_number', 'course', 'year_level', 'section', 'contact_number',
            'address', 'birthdate', 'profile_picture', 'membership_status'
        ]
        extra_kwargs = {
            'middle_name': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
            'birthdate': {'required': False, 'allow_null': True},
            'profile_picture': {'required': False, 'allow_null': True},
            'membership_status': {'required': False},
        }

    def validate_user_email(self, value):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_student_number(self, value):
        if MemberProfile.objects.filter(student_number__iexact=value).exists():
            raise serializers.ValidationError("A member with this student number already exists.")
        return value

    def create(self, validated_data):
        import secrets
        import string

        from django.contrib.auth import get_user_model
        alphabet = string.ascii_letters + string.digits
        temp_pw = ''.join(secrets.choice(alphabet) for _ in range(16))

        User = get_user_model()
        user_email = validated_data.pop('user_email')

        username = user_email.split('@')[0]
        student_number = validated_data.get("student_number")
        if User.objects.filter(username__iexact=username).exists():
            username = f"{username}_{student_number}"

        user = User.objects.create_user(
            email=user_email,
            username=username,
            password=temp_pw,
            role='MEMBER',
            position='NONE'
        )

        profile = MemberProfile.objects.create(user=user, **validated_data)
        return profile
