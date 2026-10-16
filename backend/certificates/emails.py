"""Certificate email notifications.

Emails are a best-effort second step: issuing certificates must never wait on
or fail because of email delivery. Delivery happens in a background thread.
"""

import logging
import threading
from concurrent.futures import ThreadPoolExecutor

from django.conf import settings

from common.email_service import send_email_blocking

logger = logging.getLogger(__name__)


def _send_one(certificate):
    try:
        member = certificate.member
        user = member.user
        if not user.email:
            return
        link = f"{getattr(settings, 'FRONTEND_URL', '')}/member/profile"
        full_name = ' '.join(
            p for p in [member.first_name, member.middle_name, member.last_name] if p
        ) or 'Member'
        html = f"""
        <div style="font-family:Arial,Helvetica,sans-serif;color:#0f172a;line-height:1.5">
          <h2 style="margin:0 0 8px">Your certificate is ready 📜</h2>
          <p>Hi {full_name},</p>
          <p>Your certificate for <strong>{certificate.event_name}</strong>
             ({certificate.event_date.strftime('%B %d, %Y')}) is now available in
             your Profile section in ICpEP Portal.</p>
          <p>
            <a href="{link}"
               style="display:inline-block;background:#0284c7;color:#ffffff;
                      padding:10px 18px;border-radius:9999px;text-decoration:none;
                      font-weight:600">View my certificates</a>
          </p>
          <p style="font-size:12px;color:#64748b">
            Verification code: {certificate.verification_code}
          </p>
        </div>
        """
        send_email_blocking(
            subject=f"Your certificate for {certificate.event_name}",
            recipient_email=user.email,
            recipient_name=full_name,
            html=html,
        )
    except Exception as exc:  # never let an email break the issue flow
        logger.warning('Certificate email failed: %s', exc)


def notify_certificate_issued(certificates):
    """Email each recipient in the background. Returns immediately."""
    certs = list(certificates)
    if not certs:
        return

    def _run():
        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = [pool.submit(_send_one, cert) for cert in certs]
            for future in futures:
                future.result()

    threading.Thread(target=_run, daemon=True).start()
