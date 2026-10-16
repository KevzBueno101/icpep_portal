from django.urls import path

from . import views

urlpatterns = [
    path('designs/', views.CertificateDesignListCreateAPIView.as_view(), name='certificate-designs'),
    path('designs/<int:pk>/', views.CertificateDesignRetrieveUpdateDestroyAPIView.as_view(), name='certificate-design-detail'),
    path('candidates/', views.CertificateCandidateListAPIView.as_view(), name='certificate-candidates'),
    path('candidates/ids/', views.CertificateCandidateIdsAPIView.as_view(), name='certificate-candidate-ids'),
    path('issue/', views.CertificateIssueAPIView.as_view(), name='certificate-issue'),
    path('mine/', views.CertificateMineListAPIView.as_view(), name='certificate-mine'),
    path('mine/mark-seen/', views.CertificateMarkSeenAPIView.as_view(), name='certificate-mark-seen'),
    path('verify/', views.CertificateVerifyAPIView.as_view(), name='certificate-verify'),
    path('export/', views.CertificateExportAPIView.as_view(), name='certificate-export'),
    path('', views.CertificateListAPIView.as_view(), name='certificates-list'),
    path('<int:pk>/download/', views.CertificateDownloadAPIView.as_view(), name='certificate-download'),
    path('<int:pk>/revoke/', views.CertificateRevokeAPIView.as_view(), name='certificate-revoke'),
]
