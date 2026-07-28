from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView


class ReorderAPIView(APIView):
    """Generic bulk-reorder endpoint.

    Subclasses must set ``model`` and ``permission_classes``.
    Accepts POST with ``{ "ordered_ids": [1, 3, 2] }`` and sets
    ``display_order`` = 0, 1, 2, … based on array index.
    """

    model = None

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

        return Response({'detail': 'Order updated.'}, status=status.HTTP_200_OK)
