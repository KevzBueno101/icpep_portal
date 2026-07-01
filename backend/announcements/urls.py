from django.urls import path

from . import views

urlpatterns = [
    path('', views.AnnouncementListAPIView.as_view(), name='announcement-list'),
    path('<int:id>/', views.AnnouncementDetailAPIView.as_view(), name='announcement-detail'),
    path('admin/', views.AnnouncementAdminListCreateAPIView.as_view(), name='announcement-admin-list'),
    path('admin/<int:id>/', views.AnnouncementAdminDetailAPIView.as_view(), name='announcement-admin-detail'),
    path('admin/<int:announcement_id>/images/', views.AnnouncementImageUploadAPIView.as_view(), name='announcement-image-upload'),
    path('admin/images/<int:image_id>/', views.AnnouncementImageUploadAPIView.as_view(), name='announcement-image-delete'),
]
