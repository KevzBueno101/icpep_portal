import logging
import threading

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.core.validators import validate_email
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

logger = logging.getLogger(__name__)

REQUIRED_FIELDS = {'name', 'email', 'summary'}

DEFAULT_BUG_REPORT_EMAIL = 'icpep.se.catsuchapter@gmail.com'


class BugReportAPIView(APIView):
    """Accept a bug report and email it to the chapter inbox."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.data or {}

        errors = {}
        missing = REQUIRED_FIELDS - set(payload)
        if missing:
            errors['detail'] = (
                'Missing required fields: ' + ', '.join(sorted(missing))
            )
        email = str(payload.get('email', '')).strip()
        if email:
            try:
                validate_email(email)
            except ValidationError:
                errors['email'] = 'Enter a valid email address.'
        if not str(payload.get('summary', '')).strip():
            errors['summary'] = 'Summary of the bug is required.'
        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        threading.Thread(
            target=_deliver_bug_report, args=(payload,), daemon=True
        ).start()
        return Response(
            {'message': 'Bug report received. Thank you!'},
            status=status.HTTP_200_OK,
        )


def _deliver_bug_report(payload):
    """Send the bug report via SendGrid, falling back to SMTP."""
    recipient = getattr(settings, 'BUG_REPORT_EMAIL', '') or DEFAULT_BUG_REPORT_EMAIL
    subject = f"[Bug Report] {str(payload.get('summary', '')).strip()}"

    text = '\n'.join([
        f"Summary: {payload.get('summary', '')}",
        f"Reporter: {payload.get('name', '')} <{payload.get('email', '')}>",
        f"Page: {payload.get('page', '') or 'n/a'}",
        f"Severity: {payload.get('severity', '') or 'n/a'}",
        '',
        'Steps to reproduce:',
        payload.get('steps', '') or 'n/a',
    ])

    html_rows = ''.join(
        f"<tr><td style='padding:6px 12px;font-weight:600;color:#334155;"
        f"white-space:nowrap;'>{label}</td>"
        f"<td style='padding:6px 12px;color:#0f172a;'>{value}</td></tr>"
        for label, value in [
            ('Summary', str(payload.get('summary', ''))),
            ('Reporter', f"{payload.get('name', '')} &lt;{payload.get('email', '')}&gt;"),
            ('Page', str(payload.get('page', 'n/a'))),
            ('Severity', str(payload.get('severity', 'n/a'))),
        ]
    )
    html = f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 16px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:24px;">
<h2 style="margin:0 0 4px;color:#0f172a;font-size:18px;">New Bug Report</h2>
<p style="margin:0 0 16px;color:#64748b;font-size:13px;">
Submitted through the ICPEP.SE portal.
</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;">
{html_rows}
</table>
<p style="color:#64748b;font-size:13px;margin-top:20px;">Steps to reproduce:</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;
padding:12px 16px;color:#334155;font-size:14px;white-space:pre-wrap;">
{payload.get('steps', '') or 'n/a'}
</div>
</div>
</body>
</html>"""

    def _smtp():
        send_mail(
            subject=subject,
            message=text,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[recipient],
            html_message=html,
        )

    api_key = getattr(settings, 'SENDGRID_API_KEY', '').strip()
    if api_key:
        try:
            message = Mail(
                from_email=settings.DEFAULT_FROM_EMAIL,
                to_emails=recipient,
                subject=subject,
                html_content=html,
            )
            SendGridAPIClient(api_key).send(message)
            logger.info("Bug report email SENT to %s via SendGrid", recipient)
            return
        except Exception:
            logger.exception(
                "Bug report email SendGrid delivery FAILED; falling back to SMTP"
            )

    try:
        _smtp()
        logger.info("Bug report email SENT to %s via SMTP", recipient)
    except Exception:
        logger.exception("Bug report email delivery FAILED to %s", recipient)
