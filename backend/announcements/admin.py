from django.contrib import admin

from .models import Announcement, AnnouncementImage


class AnnouncementImageInline(admin.TabularInline):
    model = AnnouncementImage
    extra = 0


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'tags', 'author', 'pinned', 'is_published', 'created_at')
    list_filter = ('category', 'pinned', 'is_published')
    search_fields = ('title', 'body', 'author', 'tags', 'location')
    ordering = ('-created_at',)
    inlines = [AnnouncementImageInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'body', 'category', 'tags', 'author')
        }),
        ('Event Details (Optional)', {
            'fields': ('event_date_start', 'event_date_end', 'event_time_start', 'event_time_end', 'location'),
            'classes': ('collapse',)
        }),
        ('Settings', {
            'fields': ('pinned', 'is_published', 'members_only')
        }),
    )
