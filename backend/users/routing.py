from django.urls import re_path

from .consumers import OfficersConsumer

websocket_urlpatterns = [
    re_path(r"^ws/officers/$", OfficersConsumer.as_asgi()),
]

