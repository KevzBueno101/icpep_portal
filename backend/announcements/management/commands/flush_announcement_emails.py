from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Sum
from django.utils import timezone

from announcements.blast import send_announcement_blast
from announcements.models import Announcement, BlastLog


class Command(BaseCommand):
    help = (
        'Resume email blasts for announcements that hit the daily Brevo '
        'quota. Sends the queued remainder for each triggered announcement.'
    )

    def handle(self, *args, **options):
        daily_limit = int(getattr(settings, 'BREVO_DAILY_SEND_LIMIT', 300))
        sent_today = (BlastLog.objects.filter(
            created_at__date=timezone.localdate()
        ).aggregate(n=Sum('sent_count'))['n'] or 0)
        remaining_today = daily_limit - sent_today
        if remaining_today <= 0:
            self.stderr.write('Brevo daily quota already exhausted — nothing to flush today.')
            return

        announcements = Announcement.objects.filter(
            email_blast_sent_at__isnull=False,
            members_only=True,
            is_published=True,
        )

        flushed = 0
        for announcement in announcements:
            if remaining_today <= 0:
                break
            latest_log = announcement.blast_logs.first()
            already_sent = announcement.blast_logs.aggregate(
                n=Sum('sent_count')
            )['n'] or 0
            if latest_log and already_sent >= latest_log.recipient_count:
                continue
            result = send_announcement_blast(announcement)
            flushed += 1
            remaining_today -= result['sent']
            self.stdout.write(
                f'  "{announcement.title}": sent={result["sent"]} '
                f'failed={result["failed"]} queued={result["queued"]}'
            )

        self.stdout.write(f'Flushed {flushed} announcement(s).')
