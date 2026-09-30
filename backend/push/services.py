import json
import logging
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

from django.conf import settings
from pywebpush import WebPushException, webpush

from .models import PushSubscription

logger = logging.getLogger(__name__)


def _vapid_claims():
    return {'sub': getattr(settings, 'VAPID_CLAIMS_EMAIL', 'mailto:admin@example.com')}


def send_push(subscription, payload):
    """Deliver an encrypted push to a single subscription.

    Returns True on success. Deletes the subscription when the push
    service reports it is gone (HTTP 410). Swallows other errors so a
    single bad subscription never breaks a broadcast.
    """
    ok, _ = send_push_reported(subscription, payload)
    return ok


def send_push_reported(subscription, payload):
    """Deliver one push and report the outcome for diagnostics.

    Returns (ok: bool, detail: str). Unlike send_push, the underlying
    exception is not swallowed so CLI tooling (e.g. check_push) can say
    exactly why a device did not receive a message.
    """
    try:
        webpush(
            subscription_info={
                'endpoint': subscription.endpoint,
                'keys': {
                    'p256dh': subscription.p256dh,
                    'auth': subscription.auth,
                },
            },
            data=json.dumps(payload),
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims=_vapid_claims(),
            ttl=86400,
            content_encoding='aes128gcm',
        )
        return True, 'delivered'
    except WebPushException as exc:
        if exc.response is not None and exc.response.status_code == 410:
            logger.info('Push subscription gone, removing: %s', subscription.endpoint)
            subscription.delete()
            return False, '410 Gone — subscription removed'
        logger.warning('Push send failed for %s: %s', subscription.endpoint, exc)
        return False, f'WebPushException: {exc}'
    except Exception as exc:
        logger.warning('Push send failed for %s: %s', subscription.endpoint, exc)
        return False, f'{type(exc).__name__}: {exc}'


def send_announcement_push(announcement):
    """Notify all subscribers about a newly published announcement.

    Runs in a background thread so the admin's create request is not
    blocked by per-device delivery. Members-only announcements only go
    to approved members.
    """
    def _run():
        subs = PushSubscription.objects.filter(user__is_active=True)
        if announcement.members_only:
            subs = subs.filter(user__profile__membership_status='APPROVED')

        payload = {
            'title': announcement.title,
            'body': announcement.body[:120],
            'url': f"{settings.FRONTEND_URL}/announcement/{announcement.id}",
            'icon': '/pwa-192x192.png',
            'badge': '/pwa-192x192.png',
        }

        with ThreadPoolExecutor(max_workers=10) as pool:
            futures = [pool.submit(send_push, sub, payload) for sub in subs]
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception:
                    logger.exception('Unexpected error sending push')

    threading.Thread(target=_run, daemon=True).start()
