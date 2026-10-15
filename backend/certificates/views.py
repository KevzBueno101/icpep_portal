import csv

from django.db.models import Q
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from audit_logs.utils import log_action
from common.realtime import broadcast_member_update
from members.models import MemberProfile
from permissions import CanManageMembership, _is_admin_or_president

from .emails import notify_certificate_issued
from .models import (
    Certificate,
    CertificateDesign,
    generate_verification_code,
    normalize_event_key,
)
from .pdf import build_certificate_pdf
from .serializers import (
    CertificateCandidateSerializer,
    CertificateDesignSerializer,
    CertificateIssueSerializer,
    CertificateSerializer,
)


def _event_key_from_params(request):
    event_name = (request.query_params.get('event_name') or '').strip()
    event_date = (request.query_params.get('event_date') or '').strip()
    if event_name and event_date:
        return normalize_event_key(event_name, event_date)
    return ''


def _member_full_name(profile):
    parts = [profile.first_name, profile.middle_name, profile.last_name]
    return ' '.join(p for p in parts if p) or '—'


class CertificateDesignListCreateAPIView(generics.ListCreateAPIView):
    """List and create reusable certificate designs (membership access only)."""

    permission_classes = [CanManageMembership]
    serializer_class = CertificateDesignSerializer

    def get_queryset(self):
        qs = CertificateDesign.objects.all()
        include_archived = (self.request.query_params.get('include_archived') or '') in (
            '1', 'true', 'True',
        )
        if not include_archived:
            qs = qs.filter(is_archived=False)
        return qs

    def perform_create(self, serializer):
        design = serializer.save(created_by=self.request.user)
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.CERTIFICATE_DESIGN_CREATED,
            entity_type=AuditLog.EntityType.CERTIFICATE,
            entity_id=design.id,
            entity_name=design.name,
            request=self.request,
        )
        broadcast_member_update('certificates')


class CertificateDesignRetrieveUpdateDestroyAPIView(
    generics.RetrieveUpdateDestroyAPIView
):
    permission_classes = [CanManageMembership]
    serializer_class = CertificateDesignSerializer
    queryset = CertificateDesign.objects.all()

    def perform_update(self, serializer):
        design = serializer.save()
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.CERTIFICATE_DESIGN_UPDATED,
            entity_type=AuditLog.EntityType.CERTIFICATE,
            entity_id=design.id,
            entity_name=design.name,
            request=self.request,
        )
        broadcast_member_update('certificates')

    def perform_destroy(self, instance):
        # Archive instead of deleting once a design has been used, so issued
        # certificates keep a meaningful reference.
        if instance.certificates.exists():
            instance.is_archived = True
            instance.save(update_fields=['is_archived'])
        else:
            instance.delete()
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.CERTIFICATE_DESIGN_DELETED,
            entity_type=AuditLog.EntityType.CERTIFICATE,
            entity_id=instance.id,
            entity_name=instance.name,
            request=self.request,
        )
        broadcast_member_update('certificates')


class CertificateCandidateListAPIView(generics.ListAPIView):
    """Searchable, paginated list of members eligible to receive a certificate.

    Only approved, active members are returned. When ``event_name`` and
    ``event_date`` are supplied, members who already hold a certificate for that
    event are flagged so the UI can lock them out.
    """

    permission_classes = [CanManageMembership]
    serializer_class = CertificateCandidateSerializer

    def get_queryset(self):
        qs = (
            MemberProfile.objects.select_related('user')
            .filter(
                membership_status=MemberProfile.Status.APPROVED,
                user__is_active=True,
            )
            .order_by('last_name', 'first_name', 'id')
        )
        search = (self.request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(middle_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(student_number__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__username__icontains=search)
            )
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        event_key = _event_key_from_params(self.request)
        issued_map = {}
        if event_key:
            issued_map = dict(
                Certificate.objects.filter(
                    event_key=event_key, status=Certificate.Status.ISSUED
                ).values_list('member_id', 'id')
            )
        context['issued_member_ids'] = set(issued_map.keys())
        context['issued_cert_map'] = issued_map
        return context


class CertificateCandidateIdsAPIView(APIView):
    """Return every eligible member id matching a search (for 'Select all').

    Kept separate from the paginated candidate list so the UI can add a whole
    search result (or all members) to the selection in one request.
    """

    permission_classes = [CanManageMembership]
    MAX_RESULTS = 5000

    def get(self, request):
        qs = (
            MemberProfile.objects.select_related('user')
            .filter(
                membership_status=MemberProfile.Status.APPROVED,
                user__is_active=True,
            )
            .order_by('id')
        )
        search = (request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(first_name__icontains=search)
                | Q(middle_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(student_number__icontains=search)
                | Q(user__email__icontains=search)
                | Q(user__username__icontains=search)
            )

        event_key = _event_key_from_params(request)
        issued = set()
        if event_key:
            issued = set(
                Certificate.objects.filter(
                    event_key=event_key, status=Certificate.Status.ISSUED
                ).values_list('member_id', flat=True)
            )

        total = qs.count()
        members = [
            {'id': profile.id, 'full_name': _member_full_name(profile)}
            for profile in qs[: self.MAX_RESULTS]
            if profile.id not in issued
        ]
        return Response({
            'members': members,
            'already_issued_count': len(issued),
            'truncated': total > self.MAX_RESULTS,
        })


class CertificateIssueAPIView(APIView):
    """Issue certificates to a selected set of members for one event.

    The server re-validates everything: the caller must have membership access,
    every id must be a real approved member, and anyone already holding a
    certificate for the same event is skipped.
    """

    permission_classes = [CanManageMembership]

    def post(self, request):
        serializer = CertificateIssueSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        design = get_object_or_404(CertificateDesign, pk=data['design'])
        event_name = data['event_name']
        event_date = data['event_date']
        member_ids = list(dict.fromkeys(data['member_ids']))
        event_key = normalize_event_key(event_name, event_date)

        profiles = {
            profile.id: profile
            for profile in MemberProfile.objects.select_related('user').filter(
                id__in=member_ids
            )
        }
        already_issued = set(
            Certificate.objects.filter(
                event_key=event_key,
                status=Certificate.Status.ISSUED,
                member_id__in=member_ids,
            ).values_list('member_id', flat=True)
        )

        snapshot = design.snapshot()
        created = []
        skipped = []
        for member_id in member_ids:
            profile = profiles.get(member_id)
            if profile is None:
                skipped.append({'id': member_id, 'name': '', 'reason': 'Not a valid member.'})
                continue
            name = f'{profile.first_name} {profile.last_name}'.strip()
            if (
                profile.membership_status != MemberProfile.Status.APPROVED
                or not profile.user.is_active
            ):
                skipped.append({
                    'id': member_id, 'name': name,
                    'reason': 'Member is not active/approved.',
                })
                continue
            if member_id in already_issued:
                skipped.append({
                    'id': member_id, 'name': name,
                    'reason': 'Already issued for this event.',
                })
                continue

            created.append(Certificate.objects.create(
                member=profile,
                design=design,
                design_snapshot=snapshot,
                event_name=event_name,
                event_date=event_date,
                event_key=event_key,
                verification_code=generate_verification_code(),
                issued_by=request.user,
            ))

        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.CERTIFICATE_ISSUED,
            entity_type=AuditLog.EntityType.CERTIFICATE,
            entity_name=event_name,
            details={
                'event_name': event_name,
                'event_date': event_date.isoformat(),
                'design': design.name,
                'issued': len(created),
                'skipped': len(skipped),
            },
            request=request,
        )

        if created:
            broadcast_member_update('certificates')
            notify_certificate_issued(created)

        return Response(
            {
                'issued': len(created),
                'skipped': skipped,
                'event_name': event_name,
                'event_date': event_date.isoformat(),
            },
            status=status.HTTP_201_CREATED,
        )


class CertificateListAPIView(generics.ListAPIView):
    """Admin listing of issued certificates (for review / revoking)."""

    permission_classes = [CanManageMembership]
    serializer_class = CertificateSerializer

    def get_queryset(self):
        qs = Certificate.objects.select_related('member', 'design').all()
        event_key = (self.request.query_params.get('event_key') or '').strip()
        if event_key:
            qs = qs.filter(event_key=event_key)
        status_param = (self.request.query_params.get('status') or '').strip()
        if status_param:
            qs = qs.filter(status=status_param)
        search = (self.request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(event_name__icontains=search)
                | Q(member__first_name__icontains=search)
                | Q(member__last_name__icontains=search)
                | Q(member__student_number__icontains=search)
                | Q(verification_code__icontains=search)
            )
        return qs


class CertificateExportAPIView(APIView):
    """Export issued certificates to CSV matching active filters (membership access only)."""

    permission_classes = [CanManageMembership]

    def get(self, request):
        qs = Certificate.objects.select_related('member__user', 'design', 'issued_by', 'revoked_by').all()
        event_key = (request.query_params.get('event_key') or '').strip()
        if event_key:
            qs = qs.filter(event_key=event_key)
        status_param = (request.query_params.get('status') or '').strip()
        if status_param:
            qs = qs.filter(status=status_param)
        search = (request.query_params.get('search') or '').strip()
        if search:
            qs = qs.filter(
                Q(event_name__icontains=search)
                | Q(member__first_name__icontains=search)
                | Q(member__last_name__icontains=search)
                | Q(member__student_number__icontains=search)
                | Q(verification_code__icontains=search)
            )

        qs = qs.order_by('-issued_at')

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="issued_certificates.csv"'
        response.write('\ufeff')

        writer = csv.writer(response)
        writer.writerow([
            'Verification Code',
            'Member Name',
            'Student Number',
            'Email',
            'Event Name',
            'Event Date',
            'Design Name',
            'Status',
            'Issued At',
            'Issued By',
            'Revoked At',
            'Revoked By',
        ])

        for cert in qs:
            member = cert.member
            member_name = ' '.join(
                p for p in [member.first_name, member.middle_name, member.last_name] if p
            ) or '—'
            student_num = member.student_number or ''
            email = getattr(member.user, 'email', '') if hasattr(member, 'user') and member.user else ''
            design_name = cert.design.name if cert.design else (cert.design_snapshot or {}).get('title', '')
            issued_by_name = getattr(cert.issued_by, 'email', '') if cert.issued_by else ''
            revoked_by_name = getattr(cert.revoked_by, 'email', '') if cert.revoked_by else ''

            writer.writerow([
                cert.verification_code,
                member_name,
                student_num,
                email,
                cert.event_name,
                cert.event_date.isoformat() if cert.event_date else '',
                design_name,
                cert.status,
                cert.issued_at.strftime('%Y-%m-%d %H:%M:%S') if cert.issued_at else '',
                issued_by_name,
                cert.revoked_at.strftime('%Y-%m-%d %H:%M:%S') if cert.revoked_at else '',
                revoked_by_name,
            ])

        return response


class CertificateMineListAPIView(generics.ListAPIView):
    """The authenticated member's own issued certificates (newest first)."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = CertificateSerializer

    def get_queryset(self):
        profile = getattr(self.request.user, 'profile', None)
        if profile is None:
            return Certificate.objects.none()
        return (
            Certificate.objects.select_related('design')
            .filter(member=profile, status=Certificate.Status.ISSUED)
        )


class CertificateMarkSeenAPIView(APIView):
    """Mark all of the member's certificates as seen (clears the 'New' badge)."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        profile = getattr(request.user, 'profile', None)
        if profile is None:
            return Response({'updated': 0})
        updated = Certificate.objects.filter(
            member=profile, seen_at__isnull=True
        ).update(seen_at=timezone.now())
        return Response({'updated': updated})


class CertificateDownloadAPIView(APIView):
    """Build and return the certificate PDF on the fly (owner or admin only)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        certificate = get_object_or_404(
            Certificate.objects.select_related('member'), pk=pk
        )
        is_owner = certificate.member.user_id == request.user.id
        is_admin = _is_admin_or_president(request.user)
        if not is_owner and not is_admin:
            return Response(
                {'detail': 'You do not have access to this certificate.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        if certificate.status != Certificate.Status.ISSUED and not is_admin:
            return Response(
                {'detail': 'This certificate is no longer available.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            pdf_bytes = build_certificate_pdf(certificate)
        except Exception as exc:
            return Response(
                {'detail': f'Failed to generate certificate: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        safe_event = ''.join(
            ch if ch.isalnum() or ch in ('-', '_') else '_'
            for ch in certificate.event_name
        ).strip('_') or 'Certificate'
        filename = f'Certificate_{safe_event}_{certificate.verification_code}.pdf'
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response


class CertificateRevokeAPIView(APIView):
    """Cancel or restore a certificate issued by mistake (membership access only)."""

    permission_classes = [CanManageMembership]

    def post(self, request, pk):
        certificate = get_object_or_404(Certificate, pk=pk)
        action = (request.data.get('action') or 'revoke').lower()

        if action in ('restore', 'unrevoke'):
            if certificate.status == Certificate.Status.ISSUED:
                return Response(CertificateSerializer(certificate).data)

            certificate.status = Certificate.Status.ISSUED
            certificate.revoked_by = None
            certificate.revoked_at = None
            certificate.save(update_fields=['status', 'revoked_by', 'revoked_at'])

            log_action(
                user=request.user,
                action_type=AuditLog.ActionType.CERTIFICATE_ISSUED,
                entity_type=AuditLog.EntityType.CERTIFICATE,
                entity_id=certificate.id,
                entity_name=certificate.event_name,
                details={'verification_code': certificate.verification_code, 'action': 'restored'},
                request=request,
            )
            broadcast_member_update('certificates')
            return Response(CertificateSerializer(certificate).data)

        if certificate.status == Certificate.Status.REVOKED:
            return Response(CertificateSerializer(certificate).data)

        certificate.status = Certificate.Status.REVOKED
        certificate.revoked_by = request.user
        certificate.revoked_at = timezone.now()
        certificate.save(update_fields=['status', 'revoked_by', 'revoked_at'])

        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.CERTIFICATE_REVOKED,
            entity_type=AuditLog.EntityType.CERTIFICATE,
            entity_id=certificate.id,
            entity_name=certificate.event_name,
            details={'verification_code': certificate.verification_code},
            request=request,
        )
        broadcast_member_update('certificates')
        return Response(CertificateSerializer(certificate).data)


class CertificateVerifyAPIView(APIView):
    """Public verification endpoint. Exposes only non-private details."""

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def get(self, request):
        code = (request.query_params.get('code') or '').strip()
        certificate = (
            Certificate.objects.select_related('member')
            .filter(
                verification_code=code,
                status=Certificate.Status.ISSUED,
            )
            .first()
        )
        if certificate is None:
            return Response({'valid': False})

        member = certificate.member
        member_name = ' '.join(
            p for p in [member.first_name, member.middle_name, member.last_name] if p
        )
        return Response({
            'valid': True,
            'member_name': member_name,
            'event_name': certificate.event_name,
            'event_date': certificate.event_date.isoformat(),
            'issued_at': certificate.issued_at.isoformat(),
            'verification_code': certificate.verification_code,
        })
