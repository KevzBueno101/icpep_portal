from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Announcement, AnnouncementImage
from .serializers import AnnouncementImageSerializer, AnnouncementSerializer


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'role', '').upper() == 'ADMIN'
        )


class AnnouncementListAPIView(generics.ListAPIView):
    queryset = Announcement.objects.filter(is_published=True).order_by('-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.AllowAny]


class AnnouncementDetailAPIView(generics.RetrieveAPIView):
    queryset = Announcement.objects.filter(is_published=True)
    serializer_class = AnnouncementSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'id'


class AnnouncementAdminListCreateAPIView(generics.ListCreateAPIView):
    queryset = Announcement.objects.all().order_by('-created_at')
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdmin]

    def perform_create(self, serializer):
        author = serializer.validated_data.get('author')
        fallback_author = getattr(self.request.user, 'username', '') or getattr(self.request.user, 'email', '') or 'Admin'
        serializer.save(
            created_by=self.request.user,
            author=author or fallback_author,
        )


class AnnouncementAdminDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdmin]
    lookup_field = 'id'


class AnnouncementImageUploadAPIView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, announcement_id):
        announcement = get_object_or_404(Announcement, id=announcement_id)
        image_file = request.FILES.get('image')
        order = request.data.get('order', 0)

        if not image_file:
            return Response({'detail': 'No image file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        image = AnnouncementImage.objects.create(
            announcement=announcement,
            image=image_file,
            order=order,
        )

        return Response(AnnouncementImageSerializer(image, context={'request': request}).data, status=status.HTTP_201_CREATED)

    def delete(self, request, image_id):
        image = get_object_or_404(AnnouncementImage, id=image_id)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
