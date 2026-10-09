from rest_framework import generics
from rest_framework import filters
from .models import Event
from .serializers import EventSerializer


class EventListView(generics.ListCreateAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'organizer_name']
    ordering = ['display_order', '-date']


class FeaturedEventsListView(generics.ListAPIView):
    queryset = Event.objects.filter(is_featured=True)
    serializer_class = EventSerializer
    ordering = ['display_order', '-date']


class EventDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
