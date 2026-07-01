from django.conf import settings
from django.db import models


class PaymentSettings(models.Model):
    gcash_number = models.CharField(max_length=50, blank=True)
    gcash_name = models.CharField(max_length=150, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Payment Setting'
        verbose_name_plural = 'Payment Settings'

    def __str__(self):
        return f"{self.gcash_name or 'No name'} - {self.gcash_number or 'No number'}"


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
    payment_method = models.CharField(
        max_length=10,
        choices=[('ON_HAND', 'On-hand / Personal'), ('GCASH', 'GCash')],
        default='ON_HAND',
    )
    payment_proof_image = models.ImageField(upload_to='payment_proofs/', null=True, blank=True)
    address = models.TextField(blank=True)
    birthdate = models.DateField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    coe_id_image = models.ImageField(upload_to='coe_id_documents/', null=True, blank=True, verbose_name='COE/ID Document')
    admin_message = models.TextField(blank=True, verbose_name='Admin Message')
    membership_status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.user.email}"
