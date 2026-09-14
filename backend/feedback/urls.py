from django.urls import path

from .views import BugReportAPIView

urlpatterns = [
    path('bug-report/', BugReportAPIView.as_view(), name='bug-report'),
]
