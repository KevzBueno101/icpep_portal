"""Signature image cleanup.

Scanned or photographed signatures usually carry an opaque white (or near-white)
background, which would render as a visible box on top of the certificate.
These helpers strip that background by ramping the alpha channel, leaving the
ink intact and feathered at the edges.
"""

import io

from PIL import Image

# Luminance thresholds out of 255. Pixels at/above HIGH become fully
# transparent; pixels at/below LOW stay fully opaque; anything between is
# feathered so anti-aliased edges don't turn hard.
BG_HIGH = 240
BG_LOW = 180

# Downscale oversized uploads before processing to bound CPU/memory.
MAX_SIDE = 2000

# If cleaning would erase essentially the whole image, keep the original
# instead (protects light-colored or already-transparent signatures).
MAX_REMOVED_FRACTION = 0.99


def strip_light_background(
    source_bytes,
    high=BG_HIGH,
    low=BG_LOW,
    max_side=MAX_SIDE,
):
    """Return cleaned PNG bytes, or None to signal "keep the original"."""
    if not source_bytes:
        return None
    try:
        image = Image.open(io.BytesIO(source_bytes))
        image.load()
        rgba = image.convert('RGBA')

        # Already has real transparency? Nothing to strip.
        alpha_min, _ = rgba.getchannel('A').getextrema()
        if alpha_min < 250:
            return None

        if max(rgba.size) > max_side:
            rgba.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

        luminance = rgba.convert('L')
        span = max(1, high - low)
        scale = 255.0 / span
        ramp = [max(0, min(255, round((high - value) * scale))) for value in range(256)]
        rgba.putalpha(luminance.point(ramp))

        alpha = rgba.getchannel('A')
        bbox = alpha.getbbox()
        if bbox is None:
            return None

        histogram = alpha.histogram()
        total = sum(histogram)
        if total and histogram[0] / total > MAX_REMOVED_FRACTION:
            return None

        padding = max(1, round(min(rgba.size) * 0.02))
        left = max(0, bbox[0] - padding)
        top = max(0, bbox[1] - padding)
        right = min(rgba.width, bbox[2] + padding)
        bottom = min(rgba.height, bbox[3] + padding)
        rgba = rgba.crop((left, top, right, bottom))

        output = io.BytesIO()
        rgba.save(output, format='PNG', optimize=True)
        return output.getvalue()
    except Exception:
        return None
