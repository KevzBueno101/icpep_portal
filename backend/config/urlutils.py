"""Helpers for building and validating externally visible URLs."""

import re
from urllib.parse import urlsplit

# RFC 1123 hostname (ASCII letters/digits/hyphens, dot-separated labels).
# Rejects Chrome omnibox copy artifacts like 'icpep-catsu.vercel.app,+https'.
_HOST_RE = re.compile(
    r'^([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)'
    r'(\.([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?))*$'
)


def clean_origin_url(raw):
    """Return a bare `scheme://host[:port]` origin for a valid http(s) URL.

    Returns an empty string for anything unusable (empty input, non-http(s)
    scheme, missing host, userinfo, embedded paths, or a host that does not
    look like a real hostname -- e.g. a Chrome "host,+https//copy" artifact
    pasted into the FRONTEND_URL environment variable).
    """
    raw = (raw or '').strip()
    if not raw:
        return ''
    try:
        parts = urlsplit(raw)
        if parts.scheme not in ('http', 'https'):
            return ''
        netloc = parts.netloc
        host = parts.hostname
        _ = parts.port  # raises ValueError on a malformed port like '+https:443'
    except ValueError:
        return ''
    if not host or '@' in netloc or '/' in netloc:
        return ''
    if host != 'localhost' and not _HOST_RE.match(host):
        return ''
    return f"{parts.scheme}://{netloc}"
