import logging
import threading

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from common.email_service import send_email_blocking

from .serializers import PartnershipSerializer

logger = logging.getLogger(__name__)

DEFAULT_PARTNERSHIP_EMAIL = 'icpep.se.catsuchapter@gmail.com'


class PartnershipAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PartnershipSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        partnership = serializer.save()

        threading.Thread(
            target=_deliver_partnership, args=(partnership, request), daemon=True
        ).start()

        return Response(
            {'message': 'Partnership proposal sent successfully!'},
            status=status.HTTP_200_OK,
        )


def _attachment_url(partnership, request):
    if not partnership.attachment:
        return None
    url = partnership.attachment.url
    if url.startswith('/'):
        url = request.build_absolute_uri(url)
    return url


def _deliver_partnership(partnership, request):
    """Email the proposal via Brevo (background thread, failures logged only)."""
    recipient = getattr(settings, 'BUG_REPORT_EMAIL', '') or DEFAULT_PARTNERSHIP_EMAIL
    subject = f"Partnership Proposal from {partnership.name.strip()}"

    attachment = _attachment_url(partnership, request)

    attachment_row = (
        f"<tr><td style='padding:6px 12px;font-weight:600;color:#334155;"
        f"white-space:nowrap;'>Attachment</td>"
        f"<td style='padding:6px 12px;color:#0f172a;'>"
        f"<a href='{attachment}' style='color:#2563eb;'>{attachment}</a></td></tr>"
        if attachment
        else ''
    )
    html_rows = (
        f"<tr><td style='padding:6px 12px;font-weight:600;color:#334155;"
        f"white-space:nowrap;'>{label}</td>"
        f"<td style='padding:6px 12px;color:#0f172a;'>{value}</td></tr>"
        for label, value in [
            ('Name', partnership.name),
            ('Email', partnership.email),
        ]
    )
    html = f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 16px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;">
<h2 style="margin:0 0 4px;color:#0f172a;font-size:20px;">New Partnership Proposal</h2>
<p style="margin:0 0 16px;color:#64748b;font-size:13px;">
Submitted through the ICPEP.SE portal.
</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;">
{''.join(html_rows)}
{attachment_row}
</table>
<div style="margin-top:16px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;color:#334155;font-size:14px;white-space:pre-wrap;">
{partnership.message}
</div>
<p style="color:#64748b;font-size:13px;margin-top:20px;">
Submitted through the ICPEP.SE portal on {partnership.created_at.strftime('%Y-%m-%d %H:%M')}.
</p>
</div>
</body>
</html>"""

    send_email_blocking(
        subject=subject,
        recipient_email=recipient,
        recipient_name='',
        html=html,
    )
    logger.info('Partnership email SENT to %s', recipient)
