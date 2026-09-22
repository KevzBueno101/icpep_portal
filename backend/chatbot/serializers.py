from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000, required=True)
    session_id = serializers.CharField(max_length=100, required=False, allow_blank=True)


class ChatResponseSerializer(serializers.Serializer):
    response = serializers.CharField()
    session_id = serializers.CharField(allow_blank=True)
    error = serializers.CharField(required=False, allow_blank=True)


class ChatErrorSerializer(serializers.Serializer):
    error = serializers.CharField()
    detail = serializers.CharField(required=False, allow_blank=True)
    retry_after = serializers.IntegerField(required=False, allow_null=True)