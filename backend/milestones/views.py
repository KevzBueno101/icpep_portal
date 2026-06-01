from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Milestone, MilestoneImage
from .serializers import (
    MilestoneListSerializer,
    MilestoneDetailSerializer,
    MilestoneCreateUpdateSerializer,
    MilestoneImageSerializer,
)


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and getattr(request.user, 'role', '').upper() == 'ADMIN')


class MilestoneListAPIView(generics.ListAPIView):
    """Public endpoint for timeline - shows headline, description, date, category, first image"""
    queryset = Milestone.objects.all()
    serializer_class = MilestoneListSerializer
    permission_classes = [permissions.AllowAny]


class MilestoneDetailAPIView(generics.RetrieveAPIView):
    """Public endpoint for detail page - shows all fields and all images"""
    queryset = Milestone.objects.all()
    serializer_class = MilestoneDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'


class MilestoneAdminListCreateAPIView(generics.ListCreateAPIView):
    """Admin endpoint for listing and creating milestones"""
    queryset = Milestone.objects.all()
    permission_classes = [IsAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MilestoneCreateUpdateSerializer
        return MilestoneDetailSerializer


class MilestoneAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin endpoint for updating and deleting milestones"""
    queryset = Milestone.objects.all()
    serializer_class = MilestoneCreateUpdateSerializer
    permission_classes = [IsAdmin]
    lookup_field = 'id'


class MilestoneImageUploadAPIView(APIView):
    """Admin endpoint for uploading images to a milestone"""
    permission_classes = [IsAdmin]

    def post(self, request, milestone_id):
        milestone = get_object_or_404(Milestone, id=milestone_id)
        image_file = request.FILES.get('image')
        order = request.data.get('order', 0)

        if not image_file:
            return Response({'detail': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        image = MilestoneImage.objects.create(
            milestone=milestone,
            image=image_file,
            order=order
        )

        return Response(MilestoneImageSerializer(image).data, status=status.HTTP_201_CREATED)

    def delete(self, request, image_id):
        image = get_object_or_404(MilestoneImage, id=image_id)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
