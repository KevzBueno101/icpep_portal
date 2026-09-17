import logging
import threading

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import PartnershipSerializer
from authentication.utils import send_brevo_email

logger = logging.getLogger(__name__)


class PartnershipAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PartnershipSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        partnership = serializer.save()

        full_name = partnership.name
        subject = f"Partnership Proposal from {full_name}"

        html = f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 16px;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;padding:32px;">
<h2 style="margin-top:0;color:#111;font-size:20px;">New Partnership Proposal</h2>
<p style="color:#555;line-height:1.6;font-size:15px;">
You have received a new partnership inquiry from the ICPEP.SE portal.
</p>
<table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:16px;">
<tr><td style="padding:6px 12px;font-weight:600;color:#334155;white-space:nowrap;">Name</td><td style="padding:6px 12px;color:#0f172a;">{full_name}</td></tr>
<tr><td style="padding:6px 12px;font-weight:600;color:#334155;white-space:nowrap;">Email</td><td style="padding:6px 12px;color:#0f172a;"><a href='mailto:{partnership.email}'>{partnership.email}</a></td></tr>
</table>
<div style="margin-top:16px;padding:12px 16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;color:#334155;font-size:14px;white-space:pre-wrap;">
{partnership.message}
</div>
<p style="color:#999;font-size:13px;margin-top:24px;">
Submitted through the ICPEP.SE portal on {partnership.created_at.strftime('%Y-%m-%d %H:%M')}.
</p>
</div>
</body>
</html>"""

        recipient_email = getattr(settings, 'BUG_REPORT_EMAIL', 'icpep.se.catsuchapter@gmail.com')
        thread = threading.Thread(
            target=send_brevo_email,
            args=(recipient_email, 'ICPEP.SE CatSU', subject, html),
            daemon=True,
        )
        thread.start()

        return Response(
            {'message': 'Partnership proposal sent successfully!'},
            status=status.HTTP_200_OK,
        )
