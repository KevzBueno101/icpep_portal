from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from audit_logs.utils import log_action
from common.views import ReorderAPIView
from permissions import CanManageContent, IsAdmin

from .models import AboutSection
from .serializers import AboutSectionSerializer


class AboutSectionListAPIView(generics.ListAPIView):
    serializer_class = AboutSectionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return AboutSection.objects.filter(is_published=True).order_by('display_order', 'created_at')


class AboutSectionAdminListCreateAPIView(generics.ListCreateAPIView):
    queryset = AboutSection.objects.all().order_by('display_order', 'created_at')
    serializer_class = AboutSectionSerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdmin()]
        return [CanManageContent()]

    def perform_create(self, serializer):
        section = serializer.save(created_by=self.request.user)
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.ABOUT_SECTION_CREATED,
            entity_type=AuditLog.EntityType.ABOUT,
            entity_id=section.id,
            entity_name=section.title,
            details={
                'title': section.title,
                'section_type': section.section_type,
                'is_published': section.is_published
            },
            request=self.request
        )


class AboutSectionAdminDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = AboutSection.objects.all()
    serializer_class = AboutSectionSerializer
    lookup_field = 'id'

    def get_permissions(self):
        if self.request.method == 'GET':
            return [IsAdmin()]
        return [CanManageContent()]

    def perform_update(self, serializer):
        section = serializer.save()
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.ABOUT_SECTION_UPDATED,
            entity_type=AuditLog.EntityType.ABOUT,
            entity_id=section.id,
            entity_name=section.title,
            details={
                'title': section.title,
                'section_type': section.section_type,
                'is_published': section.is_published
            },
            request=self.request
        )

    def perform_destroy(self, instance):
        entity_id = instance.id
        entity_name = instance.title
        super().perform_destroy(instance)
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.ABOUT_SECTION_DELETED,
            entity_type=AuditLog.EntityType.ABOUT,
            entity_id=entity_id,
            entity_name=entity_name,
            details={'title': entity_name},
            request=self.request
        )


class AboutSectionDocumentDeleteAPIView(APIView):
    permission_classes = [CanManageContent]

    def delete(self, request, section_id):
        section = get_object_or_404(AboutSection, id=section_id)
        entity_id = section.id
        entity_name = section.title
        if section.document:
            section.document.delete(save=False)
        section.document = None
        section.document_name = ''
        section.save(update_fields=['document', 'document_name'])

        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.ABOUT_SECTION_UPDATED,
            entity_type=AuditLog.EntityType.ABOUT,
            entity_id=entity_id,
            entity_name=entity_name,
            details={'title': entity_name, 'document_removed': True},
            request=request
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class AboutSectionReorderAPIView(ReorderAPIView):
    model = AboutSection
    permission_classes = [CanManageContent]

    def post(self, request):
        response = super().post(request)
        if response.status_code == 200:
            log_action(
                user=request.user,
                action_type=AuditLog.ActionType.ABOUT_SECTION_REORDERED,
                entity_type=AuditLog.EntityType.ABOUT,
                entity_id=None,
                entity_name='About Sections',
                details={'ordered_ids': request.data.get('ordered_ids')},
                request=request
            )
        return response
