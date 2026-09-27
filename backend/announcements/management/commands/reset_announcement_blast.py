from django.core.management.base import BaseCommand, CommandError

from announcements.models import Announcement, BlastLog


class Command(BaseCommand):
    help = (
        'Clear the email_blast_sent_at flag (and optionally blast logs) so an '
        'announcement can be blasted again. Useful after a false-success blast '
        'that delivered 0 emails (e.g. no approved members at the time).'
    )

    def add_arguments(self, parser):
        parser.add_argument('announcement_ids', nargs='+', type=int)
        parser.add_argument(
            '--clear-logs',
            action='store_true',
            help='Also delete BlastLog rows for the given announcements.',
        )

    def handle(self, *args, **options):
        for announcement_id in options['announcement_ids']:
            announcement = Announcement.objects.filter(id=announcement_id).first()
            if not announcement:
                raise CommandError(f'Announcement {announcement_id} not found.')
            if announcement.email_blast_sent_at:
                announcement.email_blast_sent_at = None
                announcement.save(update_fields=['email_blast_sent_at'])
                self.stdout.write(
                    self.style.SUCCESS(
                        f'"{announcement.title}" (id={announcement_id}): email blast flag cleared.'
                    )
                )
            else:
                self.stdout.write(
                    f'"{announcement.title}" (id={announcement_id}): no email blast flag to clear.'
                )
            if options['clear_logs']:
                deleted, _ = BlastLog.objects.filter(
                    announcement=announcement
                ).delete()
                self.stdout.write(
                    self.style.SUCCESS(f'  Deleted {deleted} BlastLog row(s).')
                )
