from django.urls import path
from .views import FeaturedContentListView, FeaturedContentDetailView

urlpatterns = [
    path('', FeaturedContentListView.as_view(), name='featured-content-list'),
    path('<int:pk>/', FeaturedContentDetailView.as_view(), name='featured-content-detail'),
]
