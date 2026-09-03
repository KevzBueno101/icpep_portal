from django.contrib import admin

from .models import AboutSection


@admin.register(AboutSection)
class AboutSectionAdmin(admin.ModelAdmin):
    list_display = ('title', 'section_type', 'is_published', 'display_order', 'created_at')
    list_filter = ('section_type', 'is_published')
    search_fields = ('title', 'body', 'document_name')
    ordering = ('display_order', 'created_at')
