from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from permissions import IsAdmin, IsOwnerOrAdmin, CanManageRoles

from .models import Milestone, MilestoneImage
from .serializers import (
    MilestoneListSerializer,
    MilestoneDetailSerializer,
    MilestoneCreateUpdateSerializer,
    MilestoneImageSerializer,
)
from audit_logs.utils import log_action
from audit_logs.models import AuditLog



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

    def perform_create(self, serializer):
        milestone = serializer.save()
        
        # Log milestone creation
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.MILESTONE_CREATED,
            entity_type=AuditLog.EntityType.MILESTONE,
            entity_id=milestone.id,
            entity_name=milestone.title,
            details={
                'title': milestone.title,
                'category': milestone.category,
                'date': str(milestone.date)
            },
            request=self.request
        )


class MilestoneAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Admin endpoint for updating and deleting milestones"""
    queryset = Milestone.objects.all()
    serializer_class = MilestoneCreateUpdateSerializer
    permission_classes = [IsAdmin]
    lookup_field = 'id'

    def perform_update(self, serializer):
        milestone = serializer.save()
        
        # Log milestone update
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.MILESTONE_UPDATED,
            entity_type=AuditLog.EntityType.MILESTONE,
            entity_id=milestone.id,
            entity_name=milestone.title,
            details={
                'title': milestone.title,
                'category': milestone.category,
                'date': str(milestone.date)
            },
            request=self.request
        )

    def perform_destroy(self, instance):
        entity_id = instance.id
        entity_name = instance.title
        super().perform_destroy(instance)
        
        # Log milestone deletion
        log_action(
            user=self.request.user,
            action_type=AuditLog.ActionType.MILESTONE_DELETED,
            entity_type=AuditLog.EntityType.MILESTONE,
            entity_id=entity_id,
            entity_name=entity_name,
            details={'title': entity_name},
            request=self.request
        )


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

        # Log milestone image upload
        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.MILESTONE_IMAGE_UPLOADED,
            entity_type=AuditLog.EntityType.MILESTONE,
            entity_id=milestone.id,
            entity_name=milestone.title,
            details={'image_order': order},
            request=request
        )

        return Response(MilestoneImageSerializer(image).data, status=status.HTTP_201_CREATED)

    def delete(self, request, image_id):
        image = get_object_or_404(MilestoneImage, id=image_id)
        milestone_id = image.milestone.id
        milestone_title = image.milestone.title
        image.delete()
        
        # Log milestone image deletion
        log_action(
            user=request.user,
            action_type=AuditLog.ActionType.MILESTONE_IMAGE_DELETED,
            entity_type=AuditLog.EntityType.MILESTONE,
            entity_id=milestone_id,
            entity_name=milestone_title,
            details={'image_id': image_id},
            request=request
        )
        
        return Response(status=status.HTTP_204_NO_CONTENT)
