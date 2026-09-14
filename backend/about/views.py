import mimetypes
import posixpath

import requests
from django.conf import settings
from django.http import Http404, HttpResponse
from django.shortcuts import get_object_or_404
from cloudinary.exceptions import Error as CloudinaryError
from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView
from urllib.parse import quote

from audit_logs.models import AuditLog
from audit_logs.utils import log_action
from common.views import ReorderAPIView
from permissions import CanManageContent, IsAdmin

from .models import AboutSection
from .serializers import AboutSectionSerializer

_CLOUDINARY_DOWNLOAD_URL = 'https://api.cloudinary.com/v1_1/{cloud}/{resource_type}/download'
_DOCUMENT_FETCH_TIMEOUT = 90
_DOCUMENT_CACHE_MAX = 32
_DOCUMENT_CONTENT_TYPES = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
}

_document_bytes_cache = {}


def _cloudinary_credentials():
    storage = getattr(settings, 'CLOUDINARY_STORAGE', None)
    if not storage:
        return None
    cloud = storage.get('CLOUD_NAME')
    api_key = storage.get('API_KEY')
    api_secret = storage.get('API_SECRET')
    if not all((cloud, api_key, api_secret)):
        return None
    return cloud, api_key, api_secret


def _fetch_document_bytes(public_id):
    cached = _document_bytes_cache.get(public_id)
    if cached is not None:
        return cached
    credentials = _cloudinary_credentials()
    if not credentials:
        return None
    cloud, api_key, api_secret = credentials
    for resource_type in ('raw', 'image'):
        url = _CLOUDINARY_DOWNLOAD_URL.format(cloud=cloud, resource_type=resource_type)
        try:
            response = requests.get(
                url,
                params={'public_id': public_id, 'type': 'upload', 'derived': 'false'},
                auth=(api_key, api_secret),
                timeout=_DOCUMENT_FETCH_TIMEOUT,
            )
        except requests.RequestException:
            continue
        if response.status_code == 200:
            if len(_document_bytes_cache) >= _DOCUMENT_CACHE_MAX:
                _document_bytes_cache.clear()
            _document_bytes_cache[public_id] = response.content
            return response.content
    return None


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
        try:
            section = serializer.save(created_by=self.request.user)
        except CloudinaryError:
            raise serializers.ValidationError({'document': 'File upload failed. Only PDF, PNG, JPG, or JPEG files are allowed.'})
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
        try:
            section = serializer.save()
        except CloudinaryError:
            raise serializers.ValidationError({'document': 'File upload failed. Only PDF, PNG, JPG, or JPEG files are allowed.'})
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


class AboutSectionDocumentContentAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, section_id):
        section = get_object_or_404(AboutSection, id=section_id)
        if not section.document:
            raise Http404('No document attached to this section.')

        data = _fetch_document_bytes(section.document.name)
        if data is None:
            return Response(
                {'detail': 'Document is temporarily unavailable. Please try again later.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        filename = section.document_name or posixpath.basename(section.document.name)
        extension = posixpath.splitext(filename)[1].lower()
        content_type = (
            _DOCUMENT_CONTENT_TYPES.get(extension)
            or mimetypes.guess_type(filename)[0]
            or 'application/octet-stream'
        )

        disposition = 'attachment' if request.query_params.get('download') else 'inline'
        response = HttpResponse(data, content_type=content_type)
        response['Content-Disposition'] = "{}; filename*=UTF-8''{}".format(disposition, quote(filename))
        response['Access-Control-Allow-Origin'] = '*'
        return response


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
