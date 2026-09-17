from rest_framework import serializers

from .models import Partnership


class PartnershipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Partnership
        fields = ['name', 'email', 'message']
