import threading
from datetime import timedelta
from urllib.parse import urlsplit, urlunsplit

from django.conf import settings
from django.utils import timezone
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

from .models import FailedLoginAttempt


def build_password_reset_url(user, token, frontend_url=None, request=None):
    uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
    base_url = (frontend_url or getattr(settings, 'FRONTEND_URL', '') or '').strip().rstrip('/')

    if base_url:
        return f"{base_url}/reset-password/{uidb64}/{token}"

    if request is not None:
        try:
            origin = (request.headers.get('Origin') or '').strip()
            if origin:
                return f"{origin.rstrip('/')}/reset-password/{uidb64}/{token}"

            referer = (request.headers.get('Referer') or '').strip()
            if referer:
                parsed_referer = urlsplit(referer)
                if parsed_referer.scheme and parsed_referer.netloc:
                    return urlunsplit((parsed_referer.scheme, parsed_referer.netloc, f"/reset-password/{uidb64}/{token}", '', ''))

            forwarded_proto = request.headers.get('X-Forwarded-Proto', request.scheme)
            forwarded_host = request.headers.get('X-Forwarded-Host') or request.headers.get('Host')
            if forwarded_host:
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


def recent_failures(email, minutes=15):
    cutoff = timezone.now() - timedelta(minutes=minutes)
    return FailedLoginAttempt.objects.filter(
        email__iexact=email, created_at__gte=cutoff
    ).count()


def send_password_reset_email(email, reset_url):
    """
    Sends the password reset email via SendGrid HTTP API in a background thread.
    Uses port 443, so it works on Render's free tier.
    Falls back to django.core.mail.send_mail if SENDGRID_API_KEY is not set.
    """
    def _send():
        try:
            subject = "Reset your ICPEP.SE password"
            html = f"""<!DOCTYPE html>
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
</html>"""

            api_key = getattr(settings, 'SENDGRID_API_KEY', '')
            if api_key:
                message = Mail(
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to_emails=email,
                    subject=subject,
                    html_content=html,
                )
                sg = SendGridAPIClient(api_key)
                sg.send(message)
            else:
                from django.core.mail import send_mail
                send_mail(
                    subject=subject,
                    message=f"Reset your password at: {reset_url}",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[email],
                    html_message=html,
                )
        except Exception:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Failed to send password reset email to %s", email)

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()