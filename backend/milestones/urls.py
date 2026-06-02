from django.urls import path
from . import views

urlpatterns = [
    # Public endpoints
    path('', views.MilestoneListAPIView.as_view(), name='milestone-list'),
    path('<int:id>/', views.MilestoneDetailAPIView.as_view(), name='milestone-detail'),
    
    # Admin endpoints
    path('admin/', views.MilestoneAdminListCreateAPIView.as_view(), name='milestone-admin-list'),
    path('admin/<int:id>/', views.MilestoneAdminDetailView.as_view(), name='milestone-admin-detail'),
    path('admin/<int:milestone_id>/images/', views.MilestoneImageUploadAPIView.as_view(), name='milestone-image-upload'),
    path('admin/images/<int:image_id>/', views.MilestoneImageUploadAPIView.as_view(), name='milestone-image-delete'),
]
