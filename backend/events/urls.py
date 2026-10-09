from django.urls import path
from .views import EventListView, FeaturedEventsListView, EventDetailView, EventImageListView

urlpatterns = [
    path('', EventListView.as_view(), name='event-list'),
    path('featured/', FeaturedEventsListView.as_view(), name='featured-events-list'),
    path('<int:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('<int:event_id>/gallery-images/', EventImageListView.as_view(), name='event-gallery-images'),
]
