from django.urls import path

from .views import (
    AuditLogCleanupAPIView,
    AuditLogExportAPIView,
    AuditLogListAPIView,
    AuditLogStatsAPIView,
)

urlpatterns = [
    path('', AuditLogListAPIView.as_view(), name='audit-log-list'),
    path('export/', AuditLogExportAPIView.as_view(), name='audit-log-export'),
    path('stats/', AuditLogStatsAPIView.as_view(), name='audit-log-stats'),
    path('cleanup/', AuditLogCleanupAPIView.as_view(), name='audit-log-cleanup'),
]
