"""Email blast for members-only announcements (Brevo, quota-aware)."""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed

from django.conf import settings
from django.db.models import Sum
from django.db.models.functions import Coalesce
from django.utils import timezone

from common.email_service import send_email_blocking

from .models import BlastLog

logger = logging.getLogger(__name__)


def approved_members():
    """Approved, active member accounts — same set used for member push."""
    from users.models import User
    return User.objects.filter(
        is_active=True,
        profile__membership_status='APPROVED',
    ).order_by('id')


def _excerpt(body, length=200):
    stripped = ' '.join((body or '').split())
    if len(stripped) <= length:
        return stripped
    return stripped[:length].rsplit(' ', 1)[0] + '…'


def _email_html(announcement, first_name):
    link = f"{settings.FRONTEND_URL}/announcement/{announcement.id}"
    return (
        '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">'
        '<div style="background:#1e3a5f;padding:20px;border-radius:8px 8px 0 0;">'
        f'<h1 style="color:#ffffff;margin:0;font-size:20px;">{announcement.title}</h1>'
        '</div>'
        '<div style="background:#ffffff;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">'
        f'<p style="color:#0f172a;">Hi {first_name},</p>'
        f'<p style="color:#334155;">{_excerpt(announcement.body)}</p>'
        f'<p><a href="{link}" style="display:inline-block;background:#1e3a5f;color:#ffffff;'
        'padding:10px 18px;border-radius:6px;text-decoration:none;">View Announcement</a></p>'
        '<p style="color:#94a3b8;font-size:12px;margin-top:20px;">'
        'You are receiving this email because you are a member of ICpEP.SE CatSU Chapter. '
        'This announcement is exclusive only for the members.</p>'
        '</div></div>'
    )


def _deliver(announcement, user):
    first_name = (user.first_name or '').strip() or 'Member'
    subject = f'ICpEP.SE: {announcement.title}'
    return send_email_blocking(
        subject,
        user.email,
        f'{first_name} {user.last_name or ""}'.strip(),
        _email_html(announcement, first_name),
    )


def send_announcement_blast(announcement):
    """Send to approved members honoring the Brevo daily cap. Returns summary dict.

    Delivery is ordered by user id and tries to continue from where
    previous runs left off, so the flush command can resume the day after
    the daily quota is exhausted.
    """
    daily_limit = int(getattr(settings, 'BREVO_DAILY_SEND_LIMIT', 300))
    recipients = list(approved_members())
    total = len(recipients)

    already_sent = (announcement.blast_logs.aggregate(
        n=Coalesce(Sum('sent_count'), 0)
    )['n'] or 0)
    unsent = max(0, total - already_sent)
    if unsent == 0:
        return {'recipients': total, 'sent': 0, 'failed': 0, 'queued': 0, 'budget': daily_limit}

    sent_today = (BlastLog.objects.filter(created_at__date=timezone.localdate()).aggregate(
        n=Coalesce(Sum('sent_count'), 0)
    )['n'] or 0)
    budget = max(0, daily_limit - sent_today)

    batch = [u for u in recipients if u.is_active][already_sent:already_sent + budget]
    queued = max(0, total - already_sent - len(batch))

    sent = 0
    failed = 0
    if batch:
        with ThreadPoolExecutor(max_workers=5) as pool:
            futures = [pool.submit(_deliver, announcement, user) for user in batch]
            for future in as_completed(futures):
                try:
                    if future.result():
                        sent += 1
                    else:
                        failed += 1
                except Exception:
                    logger.exception('Unexpected error sending announcement email')
                    failed += 1

    BlastLog.objects.create(
        announcement=announcement,
        recipient_count=total,
        sent_count=sent,
        failed_count=failed,
    )

    return {
        'recipients': total,
        'sent': sent,
        'failed': failed,
        'queued': queued,
        'budget': budget,
    }
