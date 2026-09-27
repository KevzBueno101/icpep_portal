import logging
from datetime import timedelta
from urllib.parse import urlsplit, urlunsplit

from django.conf import settings
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

from common.email_service import send_email, send_email_blocking
from config.urlutils import clean_origin_url

from .models import FailedLoginAttempt

logger = logging.getLogger(__name__)

# Number of failed logins (per email/IP, within the 15-minute window) that
# trigger the "Too many login attempts" block. Blocks on the 11th failure.
LOGIN_FAILURE_LIMIT = 10


def build_password_reset_url(user, token, frontend_url=None, request=None):
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    base_url = (
        clean_origin_url(frontend_url)
        or clean_origin_url(getattr(settings, 'FRONTEND_URL', ''))
    )

    if base_url:
        return f"{base_url}/reset-password/{uidb64}/{token}"

    if request is not None:
        try:
            origin = clean_origin_url(request.headers.get('Origin') or '')
            if origin:
                return f"{origin.rstrip('/')}/reset-password/{uidb64}/{token}"

            referer = (request.headers.get('Referer') or '').strip()
            if referer:
                parsed_referer = urlsplit(referer)
                if clean_origin_url(f"{parsed_referer.scheme}://{parsed_referer.netloc}"):
                    return urlunsplit((parsed_referer.scheme, parsed_referer.netloc, f"/reset-password/{uidb64}/{token}", '', ''))

            forwarded_proto = request.headers.get('X-Forwarded-Proto', request.scheme)
            forwarded_host = request.headers.get('X-Forwarded-Host') or request.headers.get('Host')
            if forwarded_host and clean_origin_url(f"{forwarded_proto}://{forwarded_host}"):
                return f"{forwarded_proto}://{forwarded_host.rstrip('/')}/reset-password/{uidb64}/{token}"
        except Exception:
            pass

    return f'http://localhost:5173/reset-password/{uidb64}/{token}'


def get_client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def record_failed_attempt(email, ip):
    FailedLoginAttempt.objects.create(email=email, ip_address=ip)


def clear_failures(email):
    if email:
        FailedLoginAttempt.objects.filter(email__iexact=email).delete()


def clear_ip_failures(ip):
    if ip:
        FailedLoginAttempt.objects.filter(ip_address=ip).delete()


def recent_failures(email, minutes=15):
    cutoff = timezone.now() - timedelta(minutes=minutes)
    return FailedLoginAttempt.objects.filter(
        email__iexact=email, created_at__gte=cutoff
    ).count()


def recent_ip_failures(ip, minutes=15):
    cutoff = timezone.now() - timedelta(minutes=minutes)
    return FailedLoginAttempt.objects.filter(
        ip_address=ip, created_at__gte=cutoff
    ).count()


def send_password_reset_email(email, reset_url):
    """
    Sends the password reset email via Brevo in a background thread
    (never blocks or breaks the reset request; failures are logged only).
    """
    subject = "Reset your ICPEP.SE password"
    html = f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 16px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;">
<h2 style="margin-top:0;color:#111;font-size:20px;">Reset your password</h2>
<p style="color:#555;line-height:1.6;font-size:15px;">
We received a request to reset the password for your ICPEP.SE portal account.
Click the button below to redirect you to the reset link.
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
</html>"""

    send_email(
        subject=subject,
        recipient_email=email,
        recipient_name='',
        html=html,
    )


def send_brevo_email(to_email, to_name, subject, html):
    """
    Backwards-compatible wrapper over the unified email service.
    Sends synchronously; returns True on success, False otherwise.
    """
    return send_email_blocking(
        subject=subject,
        recipient_email=to_email,
        recipient_name=to_name,
        html=html,
    )


def send_registration_welcome_email(user):
    """
    Welcome/onboarding email sent to a freshly registered member via Brevo
    (background thread so it never blocks or breaks the registration response).
    """
    full_name = f"{user.first_name} {user.last_name}".strip()
    frontend_url = getattr(settings, 'FRONTEND_URL', '') or 'https://icpep-catsu.vercel.app'
    portal_url = f"{frontend_url.rstrip('/')}/login"

    subject = 'Welcome to ICpEP.SE CatSU!'
    html = f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 16px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;">
<h2 style="margin-top:0;color:#111;font-size:20px;">Welcome, {full_name}!</h2>
<p style="color:#555;line-height:1.6;font-size:15px;">
Thank you for registering with the <strong>ICpEP.SE CatSU</strong> portal.
Your membership application has been received and is now pending approval
by the chapter.
</p>
<p style="color:#555;line-height:1.6;font-size:15px;">
You will receive a confirmation email once your membership is approved and
you can start exploring the member dashboard.
</p>
<a href="{portal_url}"
   style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;
          border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0;">
  Go to Portal
</a>
<p style="color:#999;font-size:13px;margin-top:24px;">
If you didn&rsquo;t register on the ICPEP.SE portal, you can safely ignore this email.
</p>
</div>
</body>
</html>"""

    send_email(
        subject=subject,
        recipient_email=user.email,
        recipient_name=full_name,
        html=html,
    )
