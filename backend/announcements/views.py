from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from audit_logs.utils import log_action
from common.views import ReorderAPIView
from permissions import CanManageContent, IsAdmin
from push.services import send_announcement_push

from .blast import send_announcement_blast
from .models import Announcement, AnnouncementImage
from .serializers import AnnouncementImageSerializer, AnnouncementSerializer

def broadcast_announcements_updated():
    try:
        from asgiref.sync import async_to_sync
        from channels.layers import get_channel_layer

        channel_layer = get_channel_layer()
        if channel_layer is not None:
            async_to_sync(channel_layer.group_send)(
                "member_updates",
                {
                    "type": "announcements.updated",
                    "payload": {},
                },
            )
    except Exception:
        pass


class AnnouncementListAPIView(generics.ListAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Announcement.objects.filter(is_published=True).order_by('display_order', '-created_at')
        if not self.request.query_params.get('include_members_only'):
            qs = qs.filter(members_only=False)
        return qs


class AnnouncementDetailAPIView(generics.RetrieveAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'

    def get_queryset(self):
        qs = Announcement.objects.filter(is_published=True)
        if not self.request.query_params.get('include_members_only'):
            qs = qs.filter(members_only=False)
        return qs


class AnnouncementAdminListCreateAPIView(generics.ListCreateAPIView):
    queryset = Announcement.objects.all().order_by('display_order', '-created_at')
    serializer_class = AnnouncementSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdmin()]
        return [CanManageContent()]

    def perform_create(self, serializer):
        author = serializer.validated_data.get('author')
        fallback_author = getattr(self.request.user, 'username', '') or getattr(self.request.user, 'email', '') or 'Admin'
        announcement = serializer.save(
            created_by=self.request.user,
            author=author or fallback_author,
        )

        # Log announcement creation
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.ANNOUNCEMENT_CREATED,
            entity_type=AuditLog.EntityType.ANNOUNCEMENT,
            entity_id=announcement.id,
            entity_name=announcement.title,
            details={
                'title': announcement.title,
                'category': announcement.category,
                'is_published': announcement.is_published
            },
            request=self.request
        )

        # Push notification to subscribed devices
        if announcement.is_published:
            send_announcement_push(announcement)
            broadcast_announcements_updated()


class AnnouncementAdminDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdmin()]
        return [CanManageContent()]

    def perform_update(self, serializer):
        was_published = serializer.instance.is_published
        announcement = serializer.save()

        # Notify subscribers when a draft is published (the create path already
        # pushes immediately-published announcements).
        if announcement.is_published and not was_published:
            send_announcement_push(announcement)
            broadcast_announcements_updated()
        elif announcement.is_published or was_published:
            # If it was published or is currently published, broadcast the update
            broadcast_announcements_updated()

        # Log announcement update
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.ANNOUNCEMENT_UPDATED,
            entity_type=AuditLog.EntityType.ANNOUNCEMENT,
            entity_id=announcement.id,
            entity_name=announcement.title,
            details={
                'title': announcement.title,
                'category': announcement.category,
                'is_published': announcement.is_published
            },
            request=self.request
        )

    def perform_destroy(self, instance):
        entity_id = instance.id
        entity_name = instance.title
        super().perform_destroy(instance)

        # Log announcement deletion
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.ANNOUNCEMENT_DELETED,
            entity_type=AuditLog.EntityType.ANNOUNCEMENT,
            entity_id=entity_id,
            entity_name=entity_name,
            details={'title': entity_name},
            request=self.request
        )

        broadcast_announcements_updated()


class AnnouncementImageUploadAPIView(APIView):
    permission_classes = [CanManageContent]

    def post(self, request, announcement_id):
        announcement = get_object_or_404(Announcement, id=announcement_id)
        image_file = request.FILES.get('image')
        order = request.data.get('order', 0)

        if not image_file:
            return Response({'detail': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        image = AnnouncementImage.objects.create(
            announcement=announcement,
            image=image_file,
            order=order,
        )

        # Log announcement image upload
        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.ANNOUNCEMENT_IMAGE_UPLOADED,
            entity_type=AuditLog.EntityType.ANNOUNCEMENT,
            entity_id=announcement.id,
            entity_name=announcement.title,
            details={'image_order': order},
            request=request
        )

        return Response(AnnouncementImageSerializer(image, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def patch(self, request, image_id):
        image = get_object_or_404(AnnouncementImage, id=image_id)
        order = request.data.get('order')
        
        if order is not None:
            image.order = order
            image.save(update_fields=['order'])
        
        return Response(AnnouncementImageSerializer(image, context={'request': request}).data)

    def delete(self, request, image_id):
        image = get_object_or_404(AnnouncementImage, id=image_id)
        announcement_id = image.announcement.id
        announcement_title = image.announcement.title
        image.delete()

        # Log announcement image deletion
        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.ANNOUNCEMENT_IMAGE_DELETED,
            entity_type=AuditLog.EntityType.ANNOUNCEMENT,
            entity_id=announcement_id,
            entity_name=announcement_title,
            details={'image_id': image_id},
            request=request
        )

        return Response(status=status.HTTP_204_NO_CONTENT)


class AnnouncementReorderAPIView(ReorderAPIView):
    model = Announcement
    permission_classes = [CanManageContent]


class AnnouncementEmailBlastAPIView(APIView):
    """Manually trigger the email blast for an announcement.

    Only published announcements are eligible. Each announcement can only
    be triggered once; the remainder above the daily Brevo quota is queued
    for the flush_announcement_emails command.
    """
    permission_classes = [CanManageContent]

    def post(self, request, id):
        announcement = get_object_or_404(Announcement, id=id)

        if not announcement.is_published:
            return Response(
                {'detail': 'Email blast is only available for published announcements.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if announcement.email_blast_sent_at:
            return Response(
                {'detail': 'Email blast already sent for this announcement.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = send_announcement_blast(announcement)

        # Only lock the announcement as emailed when at least one send actually
        # went out. Otherwise the admin would be permanently blocked from
        # retrying (e.g. zero approved members, or every send failed).
        if result['sent'] == 0:
            if result['recipients'] == 0:
                detail = ('No approved members found to email. The blast would '
                          'have gone to every active member with an APPROVED profile.')
            else:
                detail = (f'No emails were delivered ({result["failed"]} failed). '
                          'Check the BREVO_API_KEY/sender and try again.')
            return Response({'detail': detail, **result}, status=status.HTTP_200_OK)

        announcement.email_blast_sent_at = timezone.now()
        announcement.save(update_fields=['email_blast_sent_at'])

        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.ANNOUNCEMENT_CREATED,
            entity_type=AuditLog.EntityType.ANNOUNCEMENT,
            entity_id=announcement.id,
            entity_name=announcement.title,
            details={'email_blast': True, 'sent': result['sent'], 'failed': result['failed']},
            request=request,
        )

        return Response(result, status=status.HTTP_200_OK)
