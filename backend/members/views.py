from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from permissions import IsAdmin, IsOwnerOrAdmin, CanManageRoles
from .models import MemberProfile, PaymentSettings
from .serializers import (
    MemberRenewSerializer,
    MemberProfileSerializer,
    MemberApprovalSerializer,
    MemberCreateSerializer,
    PaymentSettingsSerializer,
)


class IsOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if getattr(request.user, 'role', '').upper() == 'ADMIN':
            return True
        return obj.user == request.user


class MemberListAPIView(generics.ListCreateAPIView):
    """List all member profiles and create a new member profile (admin only)."""
    queryset = MemberProfile.objects.all().order_by('-created_at')
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MemberCreateSerializer
        return MemberProfileSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = serializer.save()
        # Return full profile in GET format
        response_serializer = MemberProfileSerializer(profile)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)


class MemberRetrieveUpdateAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MemberProfile.objects.all()
    serializer_class = MemberProfileSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

    def perform_update(self, serializer):
        serializer.save()


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
        return Response(serializer.data)


class MemberApproveAPIView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        profile = get_object_or_404(MemberProfile, pk=pk)
        serializer = MemberApprovalSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
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
