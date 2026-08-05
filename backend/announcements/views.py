from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from audit_logs.utils import log_action
from common.views import ReorderAPIView
from permissions import CanManageContent, IsAdmin
from push.services import send_announcement_push

from .models import Announcement, AnnouncementImage
from .serializers import AnnouncementImageSerializer, AnnouncementSerializer


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


class AnnouncementAdminDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdmin()]
        return [CanManageContent()]

    def perform_update(self, serializer):
        announcement = serializer.save()

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
