from django.contrib import admin
from .models import Event, EventImage


class EventImageInline(admin.TabularInline):
    model = EventImage
    extra = 1
    fields = ['image', 'order']


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'date', 'location', 'registration_status', 'is_featured', 'display_order']
    list_filter = ['registration_status', 'is_featured', 'is_online']
    search_fields = ['title', 'description', 'organizer_name']
    list_editable = ['is_featured', 'display_order']
    ordering = ['display_order', '-date']
    inlines = [EventImageInline]
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'content', 'banner_image')
        }),
        ('Event Details', {
            'fields': ('date', 'location', 'is_online', 'meeting_link')
        }),
        ('Organizer', {
            'fields': ('organizer_name', 'organizer_logo')
        }),
        ('Additional', {
            'fields': ('tags', 'registration_status', 'is_featured', 'display_order')
        }),
    )
