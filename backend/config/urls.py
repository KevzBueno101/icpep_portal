from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse


def home(request):
    return JsonResponse({'message': 'ICPEP Membership Portal API is running'})


urlpatterns = [
    path('',        home),
    path('admin/',  admin.site.urls),
    path('api/auth/',    include('authentication.urls')),
    path('api/members/', include('members.urls')),
    path('api/users/',   include('users.urls')),       # ← new
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)