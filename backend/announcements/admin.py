from django.contrib import admin

from .models import Announcement, AnnouncementImage


class AnnouncementImageInline(admin.TabularInline):
    model = AnnouncementImage
    extra = 0


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'author', 'pinned', 'is_published', 'created_at')
    list_filter = ('category', 'pinned', 'is_published')
    search_fields = ('title', 'body', 'author')
    ordering = ('-created_at',)
    inlines = [AnnouncementImageInline]
