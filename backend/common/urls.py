from django.urls import path

from . import views

urlpatterns = [
    path('stats/', views.PublicStatsAPIView.as_view(), name='public-stats'),
]
