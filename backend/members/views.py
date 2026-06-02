from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from permissions import IsAdmin, IsOwnerOrAdmin, CanManageRoles
from .models import MemberProfile, PaymentSettings
from .serializers import (
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


class MemberRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
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
    """Set all currently APPROVED members back to PENDING.

    This is an admin-only endpoint used by the admin UI to force a renewal
    cycle where approved members must re-submit / be re-approved.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        approved_qs = MemberProfile.objects.filter(membership_status=MemberProfile.Status.APPROVED)
        renewed_count = approved_qs.update(membership_status=MemberProfile.Status.PENDING)
        return Response({'renewed_count': renewed_count}, status=status.HTTP_200_OK)
