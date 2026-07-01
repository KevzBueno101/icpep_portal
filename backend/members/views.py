from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from audit_logs.models import AuditLog
from audit_logs.utils import log_action
from permissions import IsAdmin, IsOwnerOrAdmin

from .models import MemberProfile, PaymentSettings
from .serializers import (
    MemberApprovalSerializer,
    MemberCreateSerializer,
    MemberProfileSerializer,
    MemberRenewSerializer,
    PaymentSettingsSerializer,
)


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'role', '').upper() == 'ADMIN':
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
        # Admins can see all members.
        if getattr(self.request.user, 'role', '').upper() == 'ADMIN':
            return MemberProfile.objects.all().order_by('-created_at')
        # Members can only see their own profile.
        return MemberProfile.objects.filter(user=self.request.user).order_by('-created_at')


    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MemberCreateSerializer
        return MemberProfileSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()

        # Log member creation
        if getattr(request.user, 'role', '').upper() == 'ADMIN':
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


class MemberRetrieveUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MemberProfile.objects.all()
    serializer_class = MemberProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def perform_update(self, serializer):
        profile = serializer.save()

        # Log member update
        if getattr(self.request.user, 'role', '').upper() == 'ADMIN':
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
        if getattr(self.request.user, 'role', '').upper() == 'ADMIN':
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
        if not (request.user and request.user.is_authenticated and getattr(request.user, 'role', '').upper() == 'ADMIN' and getattr(request.user, 'position', '') in ['PRESIDENT', 'TREASURER']):
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
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        profile = get_object_or_404(MemberProfile, pk=pk)
        serializer = MemberApprovalSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        old_status = profile.membership_status
        serializer.save()
        new_status = profile.membership_status

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
    permission_classes = [IsAdmin]

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
