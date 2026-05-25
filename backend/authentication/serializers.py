from rest_framework import serializers
from django.contrib.auth import get_user_model
from members.models import MemberProfile

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    # Member profile fields
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    middle_name = serializers.CharField(required=False, allow_blank=True)
    student_number = serializers.CharField()
    course = serializers.CharField()
    year_level = serializers.CharField()
    section = serializers.CharField()
    contact_number = serializers.CharField()

    class Meta:
        model = User
        fields = [
            'email', 'username', 'password', 'confirm_password',
            'first_name', 'middle_name', 'last_name',
            'student_number', 'course', 'year_level', 'section', 'contact_number'
        ]

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        # Separate profile fields
        profile_fields = {
            'first_name': validated_data.pop('first_name'),
            'middle_name': validated_data.pop('middle_name', ''),
            'last_name': validated_data.pop('last_name'),
            'student_number': validated_data.pop('student_number'),
            'course': validated_data.pop('course'),
            'year_level': validated_data.pop('year_level'),
            'section': validated_data.pop('section'),
            'contact_number': validated_data.pop('contact_number'),
        }
        validated_data.pop('confirm_password')

        user = User.objects.create_user(**validated_data)
        MemberProfile.objects.create(user=user, **profile_fields)
        return user


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'created_at']