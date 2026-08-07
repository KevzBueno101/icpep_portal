from datetime import date

from django.core.files.base import ContentFile
from django.db.models import Count
from django.db.models.functions import TruncMonth
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from audit_logs.utils import log_action
from permissions import (
    CanManageMembership,
    IsOwnerOrCanManageMembership,
    _is_admin_or_president,
)

from .models import MemberProfile, PaymentSettings, PaymentTransaction
from .receipt_generator import generate_receipt_png
from .serializers import (
    MemberApprovalSerializer,
    MemberCreateSerializer,
    MemberProfileSerializer,
    MemberRenewSerializer,
    PaymentSettingsSerializer,
    PaymentTransactionSerializer,
)


def get_current_academic_year():
    today = date.today()
    if today.month >= 8:
        return f"{today.year}-{today.year + 1}"
    return f"{today.year - 1}-{today.year}"


def generate_ref_number():
    year = date.today().year
    prefix = f"ICPEP-{year}-"
    last_txn = PaymentTransaction.objects.filter(
        reference_number__startswith=prefix
    ).order_by('-reference_number').first()
    if last_txn:
        last_seq = int(last_txn.reference_number.split('-')[-1])
        next_seq = last_seq + 1
    else:
        next_seq = 1
    return f"{prefix}{next_seq:04d}"


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if _is_admin_or_president(request.user):
            return True
        return obj.user == request.user


class MemberListAPIView(generics.ListCreateAPIView):
    """List member profiles.

    - Admin can list all members.
    - Member can list their own profile (so the frontend dashboard can load it).
    """
    queryset = MemberProfile.objects.all().order_by('-created_at')
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admins and President can see all members.
        if _is_admin_or_president(self.request.user):
            return MemberProfile.objects.all().order_by('-created_at')
        # Members can only see their own profile.
        return MemberProfile.objects.filter(user=self.request.user).order_by('-created_at')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MemberCreateSerializer
        return MemberProfileSerializer

    def create(self, request, *args, **kwargs):
        # RESTRICTED admins cannot create members via admin panel.
        if _is_admin_or_president(request.user) and getattr(request.user, 'access_level', None) == 'RESTRICTED':
            return Response(
                {'detail': 'Restricted accounts cannot create members.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        # Log member creation
        if _is_admin_or_president(request.user):
            log_action(
                user=request.user,
                action_type=AuditLog.ActionType.MEMBER_CREATED,
                entity_type=AuditLog.EntityType.MEMBER,
                entity_id=profile.id,
                entity_name=f"{profile.first_name} {profile.last_name}",
                details={'email': profile.user.email},
                request=request
            )

        # Return full profile in GET format
        response_serializer = MemberProfileSerializer(profile)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class MemberStatsAPIView(APIView):
    """Aggregate membership stats for the admin dashboard.

    - ``status_counts``: number of members per ``membership_status``.
    - ``monthly_growth``: new members per month (by ``created_at``),
      zero-filled from the earliest member month through the current month.
    """
    permission_classes = [CanManageMembership]

    def get(self, request):
        profiles = MemberProfile.objects.all()

        status_counts = {
            status_value: 0
            for status_value, _label in MemberProfile.Status.choices
        }
        for row in profiles.values('membership_status').annotate(count=Count('id')):
            status = row.get('membership_status')
            if status in status_counts:
                status_counts[status] = row['count']

        month_counts = {}
        rows = (
            profiles
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(count=Count('id'))
            .order_by('month')
        )
        for row in rows:
            month = row.get('month')
            if month is not None:
                month_counts[month.date()] = row['count']

        monthly_growth = []
        if month_counts:
            cursor = min(month_counts)
            today = date.today().replace(day=1)
            while cursor <= today:
                monthly_growth.append({
                    'month': cursor.strftime('%Y-%m'),
                    'count': month_counts.get(cursor, 0),
                })
                next_year = cursor.year + 1 if cursor.month == 12 else cursor.year
                next_month = 1 if cursor.month == 12 else cursor.month + 1
                cursor = date(next_year, next_month, 1)

        return Response({
            'total': profiles.count(),
            'status_counts': status_counts,
            'monthly_growth': monthly_growth,
        })


class MemberRetrieveUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MemberProfile.objects.all()
    serializer_class = MemberProfileSerializer

    def get_permissions(self):
        """
        - GET: owner or any admin can view.
        - PUT/PATCH: owner OR admin with membership access can edit.
        - DELETE: only admin with membership access can delete.
        """
        if self.request.method == 'DELETE':
            return [permissions.IsAuthenticated(), CanManageMembership()]
        if self.request.method in ('PUT', 'PATCH'):
            return [permissions.IsAuthenticated(), IsOwnerOrCanManageMembership()]
        return [permissions.IsAuthenticated(), IsOwnerOrAdmin()]

    def perform_update(self, serializer):
        profile = serializer.save()

        # Log member update
        if _is_admin_or_president(self.request.user):
            log_action(
                user=self.request.user,
                action_type=AuditLog.ActionType.MEMBER_UPDATED,
                entity_type=AuditLog.EntityType.MEMBER,
                entity_id=profile.id,
                entity_name=f"{profile.first_name} {profile.last_name}",
                details={'email': profile.user.email},
                request=self.request
            )

    def perform_destroy(self, instance):
        entity_name = f"{instance.first_name} {instance.last_name}"
        entity_id = instance.id
        super().perform_destroy(instance)

        # Log member deletion
        if _is_admin_or_president(self.request.user):
            log_action(
                user=self.request.user,
                action_type=AuditLog.ActionType.MEMBER_DELETED,
                entity_type=AuditLog.EntityType.MEMBER,
                entity_id=entity_id,
                entity_name=entity_name,
                details={'email': instance.user.email},
                request=self.request
            )


class PaymentSettingsAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings_obj, _ = PaymentSettings.objects.get_or_create(id=1)
        return Response(PaymentSettingsSerializer(settings_obj).data)

    def patch(self, request):
        pos_lower = (getattr(request.user, 'position', '') or '').lower()
        is_president = 'president' in pos_lower
        is_treasurer = (
            getattr(request.user, 'role', '').upper() == 'ADMIN'
            and 'treasurer' in pos_lower
        )
        if not (request.user and request.user.is_authenticated and (is_president or is_treasurer)):
            return Response({'detail': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        settings_obj, _ = PaymentSettings.objects.get_or_create(id=1)
        serializer = PaymentSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Log payment settings update
        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.PAYMENT_SETTINGS_UPDATED,
            entity_type=AuditLog.EntityType.PAYMENT_SETTINGS,
            entity_id=1,
            entity_name='Payment Settings',
            details=request.data,
            request=request
        )

        return Response(serializer.data)


class MemberApproveAPIView(APIView):
    permission_classes = [CanManageMembership]

    def post(self, request, pk):
        profile = get_object_or_404(MemberProfile, pk=pk)
        serializer = MemberApprovalSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        old_status = profile.membership_status
        serializer.save()
        new_status = profile.membership_status

        # When approving, auto-create a PaymentTransaction + e-receipt
        if new_status == 'APPROVED':
            txn_data = {
                'member': profile,
                'transaction_type': 'RENEWAL' if old_status == 'EXPIRED' else 'REGISTRATION',
                'payment_method': profile.payment_method or 'ON_HAND',
                'status': 'VERIFIED',
                'reference_number': generate_ref_number(),
                'academic_year': get_current_academic_year(),
                'approved_by_name': f"{request.user.first_name} {request.user.last_name}",
                'approved_by_position': request.user.position or '',
            }
            transaction = PaymentTransaction.objects.create(**txn_data)

            # Copy payment proof image from member profile
            if profile.payment_proof_image:
                transaction.payment_proof_image = profile.payment_proof_image
                transaction.save(update_fields=['payment_proof_image'])

            try:
                receipt_bytes = generate_receipt_png(transaction, profile)
                transaction.receipt_image.save(
                    f"receipt_{transaction.reference_number}.png",
                    ContentFile(receipt_bytes),
                    save=True,
                )
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(
                    "Failed to generate receipt for %s: %s",
                    transaction.reference_number, e
                )

        # Log member approval/rejection
        if new_status == 'APPROVED':
            action_type = AuditLog.ActionType.MEMBER_APPROVED
        elif new_status == 'REJECTED':
            action_type = AuditLog.ActionType.MEMBER_REJECTED
        else:
            action_type = AuditLog.ActionType.MEMBER_UPDATED

        log_action(
            user=request.user,
            action_type=action_type,
            entity_type=AuditLog.EntityType.MEMBER,
            entity_id=profile.id,
            entity_name=f"{profile.first_name} {profile.last_name}",
            details={
                'email': profile.user.email,
                'old_status': old_status,
                'new_status': new_status
            },
            request=request
        )

        return Response(MemberProfileSerializer(profile).data, status=status.HTTP_200_OK)


class MemberRenewAllAPIView(APIView):
    """Set all currently APPROVED members to EXPIRED.

    This sends members to the renewal page so they can submit a new year level,
    proof of payment, and COE/ID document. After renewal submission, their status
    becomes PENDING and they wait for admin approval.
    """
    permission_classes = [CanManageMembership]

    def post(self, request):
        approved_qs = MemberProfile.objects.filter(membership_status=MemberProfile.Status.APPROVED)
        renewed_count = approved_qs.update(membership_status=MemberProfile.Status.EXPIRED)

        # Log year-end reset (members expired)
        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.YEAR_END_RESET,
            entity_type=AuditLog.EntityType.MEMBER,
            entity_name='All Approved Members',
            details={'expired_count': renewed_count, 'type': 'members_expired'},
            request=request
        )

        return Response({'renewed_count': renewed_count}, status=status.HTTP_200_OK)


class MemberRenewAPIView(APIView):
    """Allow a member to renew their membership by submitting year_level and payment_proof_image.

    This endpoint is used by the frontend MembershipPending page.
    Resets the member's status to PENDING so an admin can re-approve.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        profile = get_object_or_404(MemberProfile, user=user)

        # Allow EXPIRED or REJECTED members to renew; PENDING/APPROVED are handled elsewhere
        if profile.membership_status not in [MemberProfile.Status.EXPIRED, MemberProfile.Status.REJECTED]:
            return Response(
                {'detail': 'Renewal is only available for expired or rejected memberships.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = MemberRenewSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        profile.membership_status = MemberProfile.Status.PENDING
        serializer.save()

        return Response(
            MemberProfileSerializer(profile).data,
            status=status.HTTP_200_OK
        )


class MemberTransactionListAPIView(generics.ListAPIView):
    """List all payment transactions for the authenticated member."""
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = PaymentTransactionSerializer

    def get_queryset(self):
        user = self.request.user
        if _is_admin_or_president(user):
            qs = PaymentTransaction.objects.all().order_by('-created_at')
            member_id = self.request.query_params.get('member')
            if member_id:
                qs = qs.filter(member_id=member_id)
            return qs
        try:
            profile = MemberProfile.objects.get(user=user)
        except MemberProfile.DoesNotExist:
            return PaymentTransaction.objects.none()
        return PaymentTransaction.objects.filter(member=profile).order_by('-created_at')
