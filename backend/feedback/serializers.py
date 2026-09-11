from rest_framework import serializers

from .models import BugReport

MAX_SCREENSHOT_MB = 5


class BugReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = BugReport
        fields = ['name', 'email', 'page', 'severity', 'summary', 'steps', 'screenshot']

    def validate_screenshot(self, value):
        if value and value.size > MAX_SCREENSHOT_MB * 1024 * 1024:
            raise serializers.ValidationError(
                f'Screenshot must be {MAX_SCREENSHOT_MB} MB or smaller.'
            )
        return value
