from django.urls import path

from . import views

urlpatterns = [
    path('', views.AboutSectionListAPIView.as_view(), name='about-section-list'),
    path('admin/', views.AboutSectionAdminListCreateAPIView.as_view(), name='about-section-admin-list'),
    path('admin/reorder/', views.AboutSectionReorderAPIView.as_view(), name='about-section-reorder'),
    path('admin/<int:section_id>/document/', views.AboutSectionDocumentDeleteAPIView.as_view(), name='about-section-document-delete'),
    path('admin/<int:id>/', views.AboutSectionAdminDetailAPIView.as_view(), name='about-section-admin-detail'),
]
