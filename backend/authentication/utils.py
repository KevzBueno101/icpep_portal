from datetime import timedelta
from django.utils import timezone
from django.conf import settings
from .models import FailedLoginAttempt


def get_client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def record_failed_attempt(email, ip):
    cutoff = timezone.now() - timedelta(hours=24)
    FailedLoginAttempt.objects.filter(created_at__lt=cutoff).delete()
    FailedLoginAttempt.objects.create(email=email, ip_address=ip)


def recent_failures(email, minutes=15):
    cutoff = timezone.now() - timedelta(minutes=minutes)
    return FailedLoginAttempt.objects.filter(
        email__iexact=email, created_at__gte=cutoff
    ).count()


def send_password_reset_email(email, reset_url):
    import resend
    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send({
        "from": settings.DEFAULT_FROM_EMAIL,
        "to": email,
        "subject": "Reset your ICPEP.SE password",
        "html": f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 16px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;">
<h2 style="margin-top:0;color:#111;font-size:20px;">Reset your password</h2>
<p style="color:#555;line-height:1.6;font-size:15px;">
We received a request to reset the password for your ICPEP.SE account.
Click the button below to choose a new password.
</p>
<a href="{reset_url}"
   style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;
          border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0;">
  Reset Password
</a>
<p style="color:#999;font-size:13px;margin-top:24px;">
If you didn&rsquo;t request this, you can safely ignore this email.
This link expires in 24 hours.
</p>
</div>
</body>
</html>""",
    })
