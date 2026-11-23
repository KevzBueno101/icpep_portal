from django.core.cache import cache
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from members.models import MemberProfile
from users.models import User

from .throttles import PublicStatsAnonThrottle

PUBLIC_STATS_CACHE_KEY = 'public_stats:v1'
PUBLIC_STATS_CACHE_TIMEOUT = 60 * 15  # 15 minutes


class ReorderAPIView(APIView):
    """Generic bulk-reorder endpoint.

    Subclasses must set ``model`` and ``permission_classes``.
    Accepts POST with ``{ "ordered_ids": [1, 3, 2] }`` and sets
    ``display_order`` = 0, 1, 2, … based on array index.

    Set ``realtime_resource`` to a resource name to broadcast a
    ``content.updated`` event after a successful reorder.
    """

    model = None
    realtime_resource = None

    def post(self, request):
        ordered_ids = request.data.get('ordered_ids')
        if not isinstance(ordered_ids, list) or not ordered_ids:
            return Response(
                {'detail': 'ordered_ids must be a non-empty list.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        id_set = set(ordered_ids)
        if len(id_set) != len(ordered_ids):
            return Response(
                {'detail': 'ordered_ids contains duplicates.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = self.model.objects.filter(pk__in=ordered_ids)
        if qs.count() != len(ordered_ids):
            return Response(
                {'detail': 'One or more IDs are invalid.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updates = [
            self.model(pk=pk, display_order=idx)
            for idx, pk in enumerate(ordered_ids)
        ]
        self.model.objects.bulk_update(updates, ['display_order'])

        if self.realtime_resource:
            from common.realtime import broadcast_member_update

            broadcast_member_update(self.realtime_resource)

        return Response({'detail': 'Order updated.'}, status=status.HTTP_200_OK)


class PublicStatsAPIView(APIView):
    """Public, read-only aggregate counts for external badges (e.g. shields.io).

    Returns aggregate integers only — no PII. Cached for 15 minutes and
    rate-limited per IP. GET only; other methods return 405.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    throttle_classes = [PublicStatsAnonThrottle]

    def get(self, request):
        payload = cache.get(PUBLIC_STATS_CACHE_KEY)
        if payload is None:
            payload = {
                'members': MemberProfile.objects.count(),
                'officers': User.objects.filter(
                    is_active=True,
                    is_superuser=False,
                    role__in=[User.Role.ADMIN, User.Role.OFFICER],
                ).count(),
            }
            cache.set(PUBLIC_STATS_CACHE_KEY, payload, PUBLIC_STATS_CACHE_TIMEOUT)
        return Response(payload)
