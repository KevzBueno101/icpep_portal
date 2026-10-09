from rest_framework import generics
from .models import FeaturedContent
from .serializers import FeaturedContentSerializer


class FeaturedContentListView(generics.ListAPIView):
    queryset = FeaturedContent.objects.filter(is_active=True)
    serializer_class = FeaturedContentSerializer
    ordering = ['display_order', '-created_at']


class FeaturedContentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = FeaturedContent.objects.all()
    serializer_class = FeaturedContentSerializer
