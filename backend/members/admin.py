from django.contrib import admin

from .models import MemberProfile


@admin.register(MemberProfile)
class MemberProfileAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'student_number', 'membership_status']
    list_filter = ['membership_status', 'year_level', 'course']
    search_fields = ['first_name', 'last_name', 'student_number']
