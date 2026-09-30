"""Check the Web Push (VAPID) configuration and test delivery from the CLI."""

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from push.models import PushSubscription
from push.services import send_push_reported

User = get_user_model()


def _mask(key):
    if not key:
        return '(not set)'
    return f'{key[:12]}…{key[-4:]}'


class Command(BaseCommand):
    help = (
        'Verify the Web Push configuration (VAPID keys, subscriptions) and '
        'optionally send a real test push (--send <username>).'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--send',
            type=str,
            help='Username of a user whose devices should receive a test push.',
        )

    def handle(self, *args, **options):
        public_key = getattr(settings, 'VAPID_PUBLIC_KEY', '').strip()
        private_key = getattr(settings, 'VAPID_PRIVATE_KEY', '').strip()
        claims = getattr(settings, 'VAPID_CLAIMS_EMAIL', '')

        self.stdout.write('Web Push configuration:')
        self.stdout.write(f'  Public key  : {_mask(public_key)}')
        self.stdout.write(f'  Private key : {_mask(private_key)}')
        self.stdout.write(f'  Claims email: {claims or "(not set)"}')
        self.stdout.write('')

        missing = [
            name
            for name, val in (
                ('VAPID_PUBLIC_KEY', public_key),
                ('VAPID_PRIVATE_KEY', private_key),
            )
            if not val
        ]
        if missing:
            self.stderr.write(
                'ERROR: these env vars are not set on the server: '
                + ', '.join(missing)
                + '. Add them to the environment and restart the process.'
            )
            return

        self.stdout.write(f'Push subscriptions in DB: {PushSubscription.objects.count()}')

        username = options.get('send')
        if not username:
            self.stdout.write('')
            self.stdout.write('No --send given — config check only. '
                              'Use --send <username> for a real delivery test.')
            return

        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            self.stderr.write(f'ERROR: no user with username "{username}".')
            return

        target_subs = PushSubscription.objects.filter(user=user)
        self.stdout.write(
            f'Sending a test push to "{username}" '
            f'({target_subs.count()} subscription(s))…'
        )
        if target_subs.count() == 0:
            self.stderr.write(
                '  NOTE: this user has no push subscriptions. They must enable '
                'notifications in the app first.'
            )

        payload = {
            'title': 'ICpEP.SE — Push connection test',
            'body': 'If you can read this on your device, web push is working.',
            'url': '/member/announcements',
            'icon': '/pwa-192x192.png',
            'badge': '/pwa-192x192.png',
        }

        delivered = 0
        failed = 0
        for sub in target_subs:
            label = sub.user_agent or sub.endpoint[:50]
            ok, detail = send_push_reported(sub, payload)
            if ok:
                delivered += 1
                self.stdout.write(self.style.SUCCESS(f'  {label}: {detail}'))
            else:
                failed += 1
                self.stderr.write(f'  {label}: {detail}')

        self.stdout.write('')
        if delivered:
            self.stdout.write(self.style.SUCCESS(f'  Delivered: {delivered}'))
        if failed:
            self.stderr.write(f'  Failed: {failed}')
        if delivered and not failed:
            self.stdout.write(self.style.SUCCESS('  All subscriptions delivered.'))
        elif failed:
            self.stderr.write('  Some deliveries failed — see details above.')