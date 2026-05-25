from rest_framework import serializers
from .models import MemberProfile


class MemberProfileSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_role = serializers.CharField(source='user.role', read_only=True)

    class Meta:
        model = MemberProfile
        fields = [
            'id', 'user', 'user_email', 'user_role', 'first_name', 'middle_name', 'last_name',
            'student_number', 'course', 'year_level', 'section', 'contact_number', 'address',
            'birthdate', 'profile_picture', 'membership_status', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'membership_status', 'created_at', 'updated_at']


class MemberApprovalSerializer(serializers.ModelSerializer):
    class Meta:
        model = MemberProfile
        fields = ['membership_status']