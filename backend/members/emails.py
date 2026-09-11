import logging
import threading

from django.conf import settings

from authentication.utils import send_brevo_email

logger = logging.getLogger(__name__)


def notify_member_approved(profile):
    """
    Notification email sent to a member when an admin approves their account.
    Sent via Brevo in a background thread so it never blocks the approval response.
    """
    user = profile.user
    full_name = f"{profile.first_name} {profile.last_name}".strip() or user.username
    frontend_url = getattr(settings, 'FRONTEND_URL', '') or 'https://icpep-catsu.vercel.app'

    subject = 'Your ICpEP.SE membership has been approved!'
    html = f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 16px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;">
<h2 style="margin-top:0;color:#111;font-size:20px;">Congrats, {full_name}!</h2>
<p style="color:#555;line-height:1.6;font-size:15px;">
Your <strong>ICpEP.SE CatSU</strong> membership has been <strong>approved</strong>.
You can now log in to the portal and access your member dashboard.
</p>
<a href="{frontend_url}"
   style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;
          border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin:16px 0;">
  Go to Portal
</a>
<p style="color:#999;font-size:13px;margin-top:24px;">
If you have any questions, feel free to reach out to the chapter.
</p>
</div>
</body>
</html>"""

    thread = threading.Thread(
        target=send_brevo_email,
        args=(user.email, full_name, subject, html),
        daemon=True,
    )
    thread.start()
