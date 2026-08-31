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


class PaymentTransaction(models.Model):
    class Type(models.TextChoices):
        REGISTRATION = 'REGISTRATION', 'Registration'
        RENEWAL = 'RENEWAL', 'Renewal'

    class PaymentMethod(models.TextChoices):
        ON_HAND = 'ON_HAND', 'On-hand / Personal'
        GCASH = 'GCASH', 'GCash'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        VERIFIED = 'VERIFIED', 'Verified'

    member = models.ForeignKey(
        'MemberProfile', on_delete=models.CASCADE, related_name='transactions'
    )
    transaction_type = models.CharField(max_length=20, choices=Type.choices)
    payment_method = models.CharField(max_length=10, choices=PaymentMethod.choices)
    payment_proof_image = models.ImageField(upload_to='payment_proofs/', null=True, blank=True)
    receipt_image = models.ImageField(upload_to='receipts/', null=True, blank=True, max_length=500)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    reference_number = models.CharField(max_length=30, unique=True)
    fee_amount = models.IntegerField(null=True, blank=True)
    academic_year = models.CharField(max_length=20, blank=True)
    approved_by_name = models.CharField(max_length=255, blank=True)
    approved_by_position = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.reference_number} — {self.member}"


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

    class MembershipFee(models.TextChoices):
        SEMESTER = 'SEMESTER', '₱25 — 1 Semester'
        ANNUAL = 'ANNUAL', '₱50 — 1 Academic Year'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True)
    last_name = models.CharField(max_length=100)
    student_number = models.CharField(max_length=30, unique=True)
    course = models.CharField(max_length=100)
    year_level = models.CharField(max_length=1, choices=YearLevel.choices)
    section = models.CharField(max_length=10)
    contact_number = models.CharField(max_length=20)
    membership_fee = models.CharField(
        max_length=10,
        choices=MembershipFee.choices,
        default=MembershipFee.SEMESTER,
    )
    payment_method = models.CharField(
        max_length=10,
        choices=[('ON_HAND', 'On-hand / Personal'), ('GCASH', 'GCash')],
        default='ON_HAND',
    )
    payment_proof_image = models.ImageField(upload_to='payment_proofs/', null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profiles/', null=True, blank=True)
    coe_id_image = models.ImageField(upload_to='coe_id_documents/', null=True, blank=True, verbose_name='COE/ID Document')
    admin_message = models.TextField(blank=True, verbose_name='Admin Message')
    membership_status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} — {self.user.email}"

    @property
    def fee_amount(self):
        return 50 if self.membership_fee == MemberProfile.MembershipFee.ANNUAL else 25
