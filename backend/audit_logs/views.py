from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.http import HttpResponse
import csv
from datetime import timedelta
from django.conf import settings

from .models import AuditLog
from .serializers import AuditLogSerializer
from permissions import IsAdmin


class AuditLogListAPIView(generics.ListAPIView):
    """List audit logs with filtering and pagination"""
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdmin]

    def get_queryset(self):
        queryset = AuditLog.objects.all()
        
        # Filter by action type
        action_type = self.request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        # Filter by entity type
        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        # Search by entity name or admin email/username
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                entity_name__icontains=search
            ) | queryset.filter(
                admin_user__email__icontains=search
            ) | queryset.filter(
                admin_user__username__icontains=search
            )
        
        return queryset.order_by('-timestamp')


class AuditLogExportAPIView(APIView):
    """Export audit logs to CSV"""
    permission_classes = [IsAdmin]

    def get(self, request):
        queryset = AuditLog.objects.all()
        
        # Apply same filters as list view
        action_type = request.query_params.get('action_type')
        if action_type:
            queryset = queryset.filter(action_type=action_type)
        
        entity_type = request.query_params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(timestamp__gte=date_from)
        if date_to:
            queryset = queryset.filter(timestamp__lte=date_to)
        
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                entity_name__icontains=search
            ) | queryset.filter(
                admin_user__email__icontains=search
            ) | queryset.filter(
                admin_user__username__icontains=search
            )
        
        queryset = queryset.order_by('-timestamp')
        
        # Create CSV response
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_logs.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'Timestamp',
            'Admin Email',
            'Admin Username',
            'Action',
            'Entity Type',
            'Entity Name',
            'Entity ID',
            'Details',
            'IP Address'
        ])
        
        for log in queryset:
            writer.writerow([
                log.timestamp,
                log.admin_user.email if log.admin_user else '',
                log.admin_user.username if log.admin_user else '',
                log.get_action_type_display(),
                log.get_entity_type_display(),
                log.entity_name,
                log.entity_id,
                str(log.details),
                log.ip_address or ''
            ])
        
        return response


class AuditLogStatsAPIView(APIView):
    """Get audit log statistics for badge"""
    permission_classes = [IsAdmin]

    def get(self, request):
        # Get last visit timestamp from query param (optional)
        last_visit = request.query_params.get('last_visit')
        
        if last_visit:
            # Count logs since last visit
            try:
                last_visit_dt = timezone.datetime.fromisoformat(last_visit)
                new_logs_count = AuditLog.objects.filter(
                    timestamp__gt=last_visit_dt
                ).count()
            except:
                new_logs_count = 0
        else:
            # If no last visit, return total count
            new_logs_count = AuditLog.objects.count()
        
        return Response({
            'new_logs': new_logs_count,
            'total_logs': AuditLog.objects.count()
        })


class AuditLogCleanupAPIView(APIView):
    """Delete logs older than retention period"""
    permission_classes = [IsAdmin]

    def post(self, request):
        # Get retention days from settings or default to 90
        retention_days = getattr(settings, 'AUDIT_LOG_RETENTION_DAYS', 90)
        cutoff_date = timezone.now() - timedelta(days=retention_days)
        
        # Delete old logs
        deleted_count = AuditLog.objects.filter(
            timestamp__lt=cutoff_date
        ).delete()[0]
        
        return Response({
            'message': f'Deleted {deleted_count} audit logs older than {retention_days} days.',
            'deleted_count': deleted_count,
            'retention_days': retention_days,
            'cutoff_date': cutoff_date.isoformat()
        })

