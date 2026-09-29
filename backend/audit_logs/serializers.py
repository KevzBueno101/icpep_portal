from rest_framework import serializers

from .models import AuditLog


class AuditLogSerializer(serializers.ModelSerializer):
    admin_email = serializers.SerializerMethodField()
    admin_username = serializers.SerializerMethodField()
    admin_name = serializers.SerializerMethodField()
    admin_position = serializers.SerializerMethodField()
    action_display = serializers.CharField(source='get_action_type_display', read_only=True)
    entity_display = serializers.CharField(source='get_entity_type_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id',
            'timestamp',
            'admin_user',
            'admin_email',
            'admin_username',
            'admin_name',
            'admin_position',
            'action_type',
            'action_display',
            'entity_type',
            'entity_display',
            'entity_id',
            'entity_name',
            'details',
            'ip_address',
        ]

    def get_admin_email(self, obj):
        return obj.admin_user.email if obj.admin_user else None

    def get_admin_username(self, obj):
        return obj.admin_user.username if obj.admin_user else None

    def get_admin_name(self, obj):
        if obj.admin_user is None:
            return None
        return f"{obj.admin_user.first_name} {obj.admin_user.last_name}".strip() or obj.admin_user.username

    def get_admin_position(self, obj):
        return obj.admin_user.position if obj.admin_user else None
