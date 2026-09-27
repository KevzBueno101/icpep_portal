"""Unified transactional email service via Brevo REST API.

All outbound email flows through :func:`send_email`. No SMTP fallback:
if the Brevo key is missing or delivery fails, the error is logged and the
app keeps working (emails are simply not delivered).
"""

import html as _html
import logging
import re
import threading

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

_TAG_RE = re.compile(r'<[^>]+>')
_WS_RE = re.compile(r'[ \t]+')


def _plain_text(html):
    """Rough HTML → plain text conversion for the text/plain alternative."""
    text = _TAG_RE.sub(' ', html or '')
    text = _html.unescape(text)
    lines = [line.strip() for line in text.splitlines()]
    return '\n'.join([line for line in lines if line])


def _brevo_send(payload):
    """POST one email to Brevo. Returns True on success, False otherwise."""
    api_key = getattr(settings, 'BREVO_API_KEY', '').strip()
    if not api_key:
        logger.warning('BREVO_API_KEY not set — skipping email to %s',
                       (payload.get('to') or [{}])[0].get('email'))
        return False

    try:
        res = requests.post(
            BREVO_API_URL,
            json=payload,
            headers={'api-key': api_key, 'Accept': 'application/json'},
            timeout=15,
        )
        res.raise_for_status()
        return True
    except Exception:
        logger.exception('Brevo email delivery FAILED to %s',
                         (payload.get('to') or [{}])[0].get('email'))
        return False


def _payload(subject, recipient_email, recipient_name, html, tag=None):
    return {
        'sender': {
            'name': getattr(settings, 'BREVO_SENDER_NAME', 'ICpEP.SE CatSU'),
            'email': settings.DEFAULT_FROM_EMAIL,
        },
        'to': [{'email': recipient_email, 'name': recipient_name or recipient_email}],
        'subject': subject,
        'htmlContent': html,
        'textContent': _plain_text(html),
        'headers': {
            'List-Unsubscribe': '<mailto:unsubscribe@icpepcatsu.app>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
    }


def send_email(subject, recipient_email, recipient_name='', html='', tag=None):
    """Send one transactional email via Brevo in a background thread.

    The caller's request/command is never blocked by delivery.
    """
    payload = _payload(subject, recipient_email, recipient_name, html, tag=tag)
    thread = threading.Thread(target=_brevo_send, args=(payload,), daemon=True)
    thread.start()
    return True


def send_email_blocking(subject, recipient_email, recipient_name='', html=''):
    """Synchronous variant of :func:`send_email`. Returns True/False."""
    payload = _payload(subject, recipient_email, recipient_name, html)
    return _brevo_send(payload)
