from django.urls import path
from . import views
from .views import EmailTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('register/',    views.register,                  name='register'),
    path('availability/', views.check_availability,        name='availability'),
    path('login/',       EmailTokenObtainPairView.as_view(), name='login'),
    path('admin-login/', views.admin_login,               name='admin-login'),
    path('refresh/',     TokenRefreshView.as_view(),      name='token_refresh'),
    path('me/',          views.me,                        name='me'),
]
