from rest_framework import generics, permissions, filters
from .models import Event, EventImage
from .serializers import EventSerializer, EventImageSerializer


class EventListView(generics.ListCreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'organizer_name']
    ordering = ['display_order', '-date']

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


class FeaturedEventsListView(generics.ListAPIView):
    queryset = Event.objects.filter(is_featured=True)
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]
    ordering = ['display_order', '-date']


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer


class EventImageListView(generics.ListCreateAPIView):
    serializer_class = EventImageSerializer

    def get_queryset(self):
        event_id = self.kwargs['event_id']
        return EventImage.objects.filter(event_id=event_id).order_by('order')

    def perform_create(self, serializer):
        event_id = self.kwargs['event_id']
        event = Event.objects.get(id=event_id)
        serializer.save(event=event)
