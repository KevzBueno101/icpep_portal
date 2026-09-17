from django.urls import path

from .views import PartnershipAPIView

urlpatterns = [
    path('partnership/', PartnershipAPIView.as_view(), name='partnership'),
]
