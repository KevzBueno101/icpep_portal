from django.urls import path

from . import views

urlpatterns = [
    path('admins/',                        views.admin_accounts_list, name='admin-list'),
    path('admins/pending/',               views.pending_admin_requests, name='pending-admins'),
    path('admins/<int:pk>/',               views.admin_account_detail, name='admin-detail'),
    path('admins/<int:pk>/approve/',      views.approve_admin_request, name='approve-admin'),
    path('admins/<int:pk>/reject/',       views.reject_admin_request, name='reject-admin'),
    path('admins/<int:pk>/assign-role/',   views.assign_role,         name='assign-role'),
    path('admins/year-end-reset/',         views.year_end_reset,      name='year-end-reset'),
    path('admins/create/',                 views.create_officer_account, name='create-officer'),
    path('admin/profile/', views.AdminProfileAPIView.as_view(), name='admin-profile'),
    path('officers/roster/', views.officers_roster, name='officers-roster'),
    path('officers/reorder/', views.OfficerReorderAPIView.as_view(), name='officers-reorder'),
]





