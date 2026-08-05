from django.urls import path

from . import views

urlpatterns = [
    path('vapid-key/', views.VapidKeyAPIView.as_view(), name='push-vapid-key'),
    path('subscribe/', views.PushSubscribeAPIView.as_view(), name='push-subscribe'),
    path('unsubscribe/', views.PushUnsubscribeAPIView.as_view(), name='push-unsubscribe'),
]
