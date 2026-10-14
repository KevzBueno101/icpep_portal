"""Shared helpers for broadcasting realtime content updates over Channels.

A single generic event (`content.updated`) carries a list of changed
`resources`, so any number of frontend views can react to any admin change
without the consumer needing a dedicated handler per resource.

Broadcasts are always best-effort: they never raise, so callers can invoke
them freely from views without affecting the HTTP response.
"""

RESOURCES = (
    "announcements",
    "about",
    "milestones",
    "officers",
    "admins",
    "members",
    "payment-settings",
)


def _channel_layer():
    try:
        from channels.layers import get_channel_layer

        return get_channel_layer()
    except Exception:
        return None


def _group_send(group, event_type, payload):
    channel_layer = _channel_layer()
    if channel_layer is None:
        return
    try:
        from asgiref.sync import async_to_sync

        async_to_sync(channel_layer.group_send)(
            group,
            {"type": event_type, "payload": payload},
        )
    except Exception:
        # Real-time updates are best-effort; never break the request.
        pass


def broadcast_member_update(resource, payload=None):
    """Broadcast one or more content updates to all connected clients.

    ``resource`` may be a single resource name (str) or an iterable of names.
    """
    if isinstance(resource, str):
        resources = [resource]
    else:
        resources = [r for r in resource if r]

    if not resources:
        return

    message = {"resources": resources}
    if payload:
        message.update(payload)

    _group_send("member_updates", "content.updated", message)


def broadcast_officers_updated(payload=None):
    """Backwards-compatible officers broadcast on the legacy `officers` group."""
    _group_send("officers", "officers.roster.updated", payload or {})
