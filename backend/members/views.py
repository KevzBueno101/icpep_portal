from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import MemberProfile
from .serializers import MemberProfileSerializer, MemberApprovalSerializer


class IsAdmin(permissions.BasePermission):
	def has_permission(self, request, view):
		return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '').upper() == 'ADMIN')


class IsOwnerOrAdmin(permissions.BasePermission):
	def has_object_permission(self, request, view, obj):
		if getattr(request.user, 'role', '').upper() == 'ADMIN':
			return True
		return obj.user == request.user


class MemberListAPIView(generics.ListAPIView):
	"""List all member profiles (admin only)."""
	queryset = MemberProfile.objects.all().order_by('-created_at')
	serializer_class = MemberProfileSerializer
	permission_classes = [IsAdmin]


class MemberRetrieveUpdateAPIView(generics.RetrieveUpdateAPIView):
	queryset = MemberProfile.objects.all()
	serializer_class = MemberProfileSerializer
	permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]

	def perform_update(self, serializer):
		serializer.save()


class MemberApproveAPIView(APIView):
	permission_classes = [IsAdmin]

	def post(self, request, pk):
		profile = get_object_or_404(MemberProfile, pk=pk)
		serializer = MemberApprovalSerializer(profile, data=request.data, partial=True)
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return Response(MemberProfileSerializer(profile).data, status=status.HTTP_200_OK)
