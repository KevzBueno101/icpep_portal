"""Check the Brevo integration (API key, sender, connectivity) from the CLI."""

import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from common.email_service import send_email_blocking


def _mask(key):
    if not key:
        return '(not set)'
    return f'{key[:10]}…{key[-4:]}'


class Command(BaseCommand):
    help = (
        'Verify the Brevo configuration: API key validity, sender match, and '
        'optional real test send (--send email@example.com).'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--send',
            type=str,
            help='Email address to send a real test message to (uses one Brevo credit).',
        )

    def handle(self, *args, **options):
        api_key = getattr(settings, 'BREVO_API_KEY', '').strip()
        sender_name = getattr(settings, 'BREVO_SENDER_NAME', '')
        sender_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')

        self.stdout.write('Brevo configuration:')
        self.stdout.write(f'  API key         : {_mask(api_key)}')
        self.stdout.write(f'  Sender name     : {sender_name or "(not set)"}')
        self.stdout.write(f'  Sender email    : {sender_email or "(not set)"}')
        self.stdout.write('')

        if not api_key:
            self.stderr.write(
                'ERROR: BREVO_API_KEY is not set. Add it to the environment and '
                'restart the process.'
            )
            return

        self.stdout.write('Checking API key against Brevo (/v3/account)…')
        try:
            res = requests.get(
                'https://api.brevo.com/v3/account',
                headers={'api-key': api_key, 'Accept': 'application/json'},
                timeout=15,
            )
        except Exception as exc:
            self.stderr.write(f'ERROR: network request failed: {exc}')
            return

        if res.status_code == 200:
            data = res.json() or {}
            plan = (data.get('plan') or [{}])[0].get('type') if isinstance(data.get('plan'), list) else None
            self.stdout.write(self.style.SUCCESS(f'  OK — account "{data.get("firstName", "?")}"'))
            self.stdout.write(f'  Plan: {plan or "n/a"}')
            self.stdout.write(f'  Email credits: {data.get("emailCredits") or data.get("emailHelmUniversal") or "n/a"}')
        else:
            body = (res.text or '')[:300]
            self.stderr.write(
                f'ERROR: Brevo rejected the key (status={res.status_code}): {body}'
            )
            if res.status_code == 401:
                if 'unrecognised IP' in (res.text or '') or 'authorised_ips' in (res.text or ''):
                    self.stderr.write(
                        '  Cause: Brevo Authorised IPs is enabled and this machine\'s IP '
                        'is not whitelisted. Add it at '
                        'https://app.brevo.com/security/authorised_ips (use Render\'s '
                        'outbound IP for the backend).'
                    )
                else:
                    self.stderr.write(
                        '  Likely causes: copied/truncated key, key from a different '
                        'Brevo account (refresh from the account where icpepcatsu.app '
                        'was verified), or the key was regenerated/deleted.'
                    )
            return

        if sender_email:
            if sender_email.endswith('@icpepcatsu.app'):
                self.stdout.write(
                    self.style.SUCCESS(f'  Sender domain OK — "{sender_email}" is on the icpepcatsu.app domain.')
                )
            else:
                self.stderr.write(
                    f'  WARNING: DEFAULT_FROM_EMAIL "{sender_email}" is NOT on the '
                    'verified icpepcatsu.app domain — Brevo may reject sends.'
                )
        else:
            self.stderr.write('  WARNING: DEFAULT_FROM_EMAIL is not set.')

        to = options.get('send')
        if not to:
            self.stdout.write('')
            self.stdout.write('No --send given — config check only. '
                              'Use --send someone@example.com to try a real delivery.')
            return

        self.stdout.write('')
        self.stdout.write(f'Sending a real test email to {to}… (uses one Brevo credit)')
        ok = send_email_blocking(
            'ICpEP.SE CatSU — Brevo connection test',
            to,
            'Test Recipient',
            '<p>This is a test email from the ICpEP.SE CatSU portal.</p>',
        )
        if ok:
            self.stdout.write(self.style.SUCCESS('  Deliver accepted by Brevo (queued for delivery).'))
        else:
            self.stderr.write('  ERROR: Delivering the test email failed — see logs above.')
