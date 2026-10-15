from django.contrib import admin

from .models import Certificate, CertificateDesign


@admin.register(CertificateDesign)
class CertificateDesignAdmin(admin.ModelAdmin):
    list_display = ['name', 'preset', 'is_archived', 'created_at']
    list_filter = ['preset', 'is_archived']
    search_fields = ['name', 'title']


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['event_name', 'member', 'event_date', 'status', 'issued_at']
    list_filter = ['status', 'event_date']
    search_fields = ['event_name', 'member__first_name', 'member__last_name', 'verification_code']
    readonly_fields = ['verification_code', 'issued_at']
