from django.db import models
from django.conf import settings


class MemberProfile(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        EXPIRED = 'EXPIRED', 'Expired'

    class YearLevel(models.TextChoices):
        FIRST = '1', '1st Year'
        SECOND = '2', '2nd Year'
        THIRD = '3', '3rd Year'
        FOURTH = '4', '4th Year'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    student_number = models.CharField(max_length=20, unique=True)
    course = models.CharField(max_length=100)
    year_level = models.CharField(max_length=1, choices=YearLevel.choices)
    section = models.CharField(max_length=10)
    contact_number = models.CharField(max_length=20)
    address = models.TextField(blank=True)
    birthdate = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    membership_status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.user.email}"