import mimetypes
import os
import re

import cloudinary.api
import requests
from django.conf import settings
from django.http import Http404, HttpResponse, HttpResponseForbidden, HttpResponseNotFound
from django.shortcuts import get_object_or_404
from django.views import View
from cloudinary.exceptions import Error as CloudinaryError
from cloudinary.utils import cloudinary_url
from rest_framework import generics, permissions, serializers, status
from rest_framework.response import Response
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from audit_logs.utils import log_action
from common.views import ReorderAPIView
from permissions import CanManageContent, IsAdmin

from .models import AboutSection
from .serializers import AboutSectionSerializer

_CLOUDINARY_CONTENT_URL_RE = re.compile(r'/(image|raw|video)/(upload|private|authenticated)/(?:v\d+/)?(.+)$')

_DOCUMENT_CONTENT_TYPES = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
}


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


class AboutSectionDocumentContentAPIView(View):
    """Streams an about section's attached document.

    Plain Django view (no DRF content negotiation) so navigating to the URL
    returns the raw file bytes instead of the browsable API. Cloudinary stores
    these assets in a restricted/locked mode, which rejects plain unsigned
    delivery URLs with 401, so files are fetched server-side using signed
    delivery URLs (or the local filesystem in dev) and streamed same-origin.
    """

    def get(self, request, section_id):
        section = get_object_or_404(AboutSection, id=section_id)
        if not section.is_published and not IsAdmin().has_permission(request, self):
            return HttpResponseForbidden('You do not have permission to view this document.')

        if not section.document:
            return HttpResponseNotFound('No document attached.')

        data = self._load_bytes(section)
        if data is None:
            raise Http404('Document is unavailable.')

        name = section.document_name or section.document.name.rsplit('/', 1)[-1]
        ext = os.path.splitext(name)[1].lower()
        content_type = _DOCUMENT_CONTENT_TYPES.get(
            ext, mimetypes.guess_type(name)[0] or 'application/octet-stream'
        )

        disposition = 'attachment' if request.GET.get('download') == '1' else 'inline'
        safe_name = name.replace('"', '').replace('\n', '')
        response = HttpResponse(data, content_type=content_type)
        response['Content-Disposition'] = f'{disposition}; filename="{safe_name}"'
        return response

    def _load_bytes(self, section):
        if not getattr(settings, 'CLOUDINARY_STORAGE', None):
            with section.document.open('rb') as f:
                return f.read()

        url = section.document.url
        match = _CLOUDINARY_CONTENT_URL_RE.search(url)
        if not match:
            return None
        resource_type, public_id = match.group(1), match.group(3)
        for signed_url in self._signed_delivery_urls(public_id, resource_type):
            try:
                resp = requests.get(signed_url, timeout=30)
            except requests.RequestException:
                continue
            if resp.status_code == 200:
                return resp.content
            if resp.status_code == 404:
                break
        return None

    @staticmethod
    def _signed_delivery_urls(public_id, resource_type):
        detected_type = None
        try:
            info = cloudinary.api.resource(public_id, resource_type=resource_type)
            detected_type = info.get('type')
        except cloudinary.exceptions.Error:
            pass
        ordered_types = [t for t in ('upload', 'authenticated', 'private') if t != detected_type]
        if detected_type:
            ordered_types.insert(0, detected_type)
        signed_urls = []
        for asset_type in ordered_types:
            signed, _ = cloudinary_url(
                public_id,
                resource_type=resource_type,
                type=asset_type,
                secure=True,
                sign_url=True,
            )
            signed_urls.append(signed)
        return signed_urls


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
