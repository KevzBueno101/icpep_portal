from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PushSubscription


class VapidKeyAPIView(APIView):
    """Public endpoint exposing the VAPID public key to the frontend."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        public_key = getattr(settings, 'VAPID_PUBLIC_KEY', '')
        if not public_key:
            return Response(
                {'detail': 'VAPID is not configured on the server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({'public_key': public_key})


class PushSubscribeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        endpoint = (request.data.get('endpoint') or '').strip()
        p256dh = (request.data.get('p256dh') or '').strip()
        auth = (request.data.get('auth') or '').strip()

        if not endpoint or not p256dh or not auth:
            return Response(
                {'detail': 'endpoint, p256dh, and auth are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subscription, created = PushSubscription.objects.get_or_create(
            endpoint=endpoint,
            defaults={
                'user': request.user,
                'p256dh': p256dh,
                'auth': auth,
                'user_agent': request.META.get('HTTP_USER_AGENT', '')[:500],
            },
        )
        if not created:
            subscription.user = request.user
            subscription.p256dh = p256dh
            subscription.auth = auth
            subscription.user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]
            subscription.save(update_fields=['user', 'p256dh', 'auth', 'user_agent', 'updated_at'])

        return Response(
            {'id': subscription.id},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class PushUnsubscribeAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        endpoint = (request.data.get('endpoint') or '').strip()
        if not endpoint:
            return Response(
                {'detail': 'endpoint is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
