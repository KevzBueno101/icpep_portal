from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def home(request):
    return JsonResponse({'message': 'ICPEP Membership Portal API is running'})


urlpatterns = [
    path('',        home),
    path('admin/',  admin.site.urls),
    path('api/auth/',    include('authentication.urls')),
    path('api/members/', include('members.urls')),
    path('api/users/',   include('users.urls')),
    path('api/milestones/', include('milestones.urls')),
    path('api/announcements/', include('announcements.urls')),
    path('api/audit-logs/', include('audit_logs.urls')),
    # duplicate include removed
]

# Serve locally stored media files only when DEBUG=True and MEDIA_ROOT is set.
if settings.DEBUG and settings.MEDIA_ROOT:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
