from django.urls import path
from . import views

urlpatterns = [
    path('', views.MemberListAPIView.as_view(), name='members-list'),
    path('<int:pk>/', views.MemberRetrieveUpdateAPIView.as_view(), name='member-detail'),
    path('<int:pk>/approve/', views.MemberApproveAPIView.as_view(), name='member-approve'),
]
