"""On-demand certificate PDF generation.

Certificates are never stored as files. The background/signature images live in
the normal media storage (Cloudinary in production); a PDF is rendered the
moment a member (or admin) downloads one, from the design snapshot frozen onto
the certificate at issue time.
"""

import io

from django.conf import settings
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as pdf_canvas

PAGE_W, PAGE_H = landscape(A4)  # 841.89 x 595.28 points (landscape A4)

CONTENT_MARGIN = 70  # horizontal inset (points) used for left/right alignment

# Symmetric vertical whitespace between the text and the top/bottom page edges.
EDGE_PADDING = 48

# Title baseline from the top edge (larger = more breathing room under the header).
TITLE_TOP = 140

# Signature row (bottom band): up to 2 rows of 2 signatories.
SIGNATORY_BASELINE = EDGE_PADDING  # bottom-row position-label baseline, from bottom
SIGNATORY_COMPACT_BOTTOM = 34  # used when the band has 2 rows
SIGNATORIES_PER_ROW = 2
SIGNATORY_ROWS_MAX = 2
SIG_IMG_MAX_W = 110  # cap signature image width so it clears the QR block
SIGNATORY_CLEARANCE = 12  # gap kept between the band and the text above it

# QR verification block (bottom-right corner).
QR_SIZE = 60
QR_RIGHT_MARGIN = 28

SERIF = 'Times-Roman'
SERIF_BOLD = 'Times-Bold'
SERIF_ITALIC = 'Times-BoldItalic'
SANS = 'Helvetica'
SANS_BOLD = 'Helvetica-Bold'


def _hex_color(value, fallback='#0f172a'):
    try:
        value = (value or '').strip()
        if value.startswith('#') and len(value) in (4, 7):
            return HexColor(value)
    except Exception:
        pass
    return HexColor(fallback)


def _fetch_image_bytes(url):
    """Fetch image bytes from Cloudinary (http) or local media storage."""
    if not url:
        return None
    try:
        if url.startswith('http'):
            import requests

            res = requests.get(url, timeout=15)
            if res.status_code == 200:
                return res.content
            return None

        from django.core.files.storage import default_storage

        media_url = getattr(settings, 'MEDIA_URL', '') or '/media/'
        prefix = media_url.lstrip('/')
        path = url.lstrip('/')
        if prefix and path.startswith(prefix):
            path = path[len(prefix):]
        if path and default_storage.exists(path):
            with default_storage.open(path) as handle:
                return handle.read()
    except Exception:
        return None
    return None


def _normalize_align(value):
    value = (value or 'CENTER').upper()
    return value if value in ('LEFT', 'CENTER', 'RIGHT') else 'CENTER'


def _draw_aligned(c, text, y, align):
    """Draw a single line honoring the design's text alignment."""
    if align == 'LEFT':
        c.drawString(CONTENT_MARGIN, y, text)
    elif align == 'RIGHT':
        c.drawRightString(PAGE_W - CONTENT_MARGIN, y, text)
    else:
        c.drawCentredString(PAGE_W / 2, y, text)


def _wrap_text(text, font, size, max_width, c):
    words = (text or '').split()
    lines, current = [], ''
    for word in words:
        trial = f'{current} {word}'.strip()
        if not current or c.stringWidth(trial, font, size) <= max_width:
            current = trial
        else:
            lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def _draw_text_block(c, text, font, size, color, y_top, max_width, leading, align='CENTER'):
    lines = _wrap_text(text, font, size, max_width, c)
    c.setFont(font, size)
    c.setFillColor(color)
    y = y_top
    for line in lines:
        _draw_aligned(c, line, y, align)
        y -= leading
    return y


def _draw_background(c, snapshot):
    image_bytes = _fetch_image_bytes(snapshot.get('background_url'))
    if image_bytes:
        try:
            c.drawImage(
                ImageReader(io.BytesIO(image_bytes)),
                0, 0, width=PAGE_W, height=PAGE_H,
                preserveAspectRatio=False, mask='auto',
            )
            return
        except Exception:
            pass

    # Plain background: white fill only (no border frame or accent lines).
    c.setFillColor(HexColor('#ffffff'))
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)


def _draw_signature(
    c, x_center, y_line, name, position, color, signature_url,
    img_max_w=110, img_max_h=46, name_gap=16, image_gap=4,
):
    if signature_url:
        sig_bytes = _fetch_image_bytes(signature_url)
        if sig_bytes:
            try:
                img = ImageReader(io.BytesIO(sig_bytes))
                iw, ih = img.getSize()
                target_w, target_h = img_max_w, img_max_h
                scale = min(target_w / iw, target_h / ih)
                w, h = iw * scale, ih * scale
                c.drawImage(img, x_center - w / 2, y_line + image_gap, width=w, height=h, mask='auto')
            except Exception:
                pass

    c.setFillColor(color)
    c.setFont(SERIF_BOLD, 13)
    c.drawCentredString(x_center, y_line - name_gap, name or '')
    c.setFont(SANS, 9.5)
    c.drawCentredString(x_center, y_line - name_gap - 13, (position or '').upper())


def _row_x_fractions(count, align):
    """Horizontal centers for one signature row (max 2 per row)."""
    if align == 'LEFT':
        left, right = 0.18, 0.44
    elif align == 'RIGHT':
        left, right = 0.56, 0.82
    else:
        left, right = 0.30, 0.70
    if count <= 0:
        return []
    if count == 1:
        return [(left + right) / 2]
    spacing = (right - left) / (count - 1)
    return [left + spacing * i for i in range(count)]


def _draw_signatory_band(c, signatories, align, color, top_clearance):
    """Bottom-aligned signatory band: 2 per row, max 2 rows, never overlapping the text above."""
    rows = [
        signatories[i:i + SIGNATORIES_PER_ROW]
        for i in range(0, len(signatories), SIGNATORIES_PER_ROW)
    ][:SIGNATORY_ROWS_MAX]

    image_gap = 4
    row_gap = 8
    name_gap = 16 if len(rows) == 1 else 13
    band_bottom = SIGNATORY_BASELINE if len(rows) == 1 else SIGNATORY_COMPACT_BOTTOM
    available = max(0, top_clearance - band_bottom)
    text_zone = name_gap + 13 + image_gap

    def fit_height(row_count):
        """Largest image height that keeps `row_count` rows under the text above."""
        return (available - (row_count - 1) * row_gap) / row_count - text_zone

    img_h = fit_height(len(rows))
    while len(rows) > 1 and img_h < 14:
        rows.pop()
        name_gap = 16 if len(rows) == 1 else 13
        band_bottom = SIGNATORY_BASELINE if len(rows) == 1 else SIGNATORY_COMPACT_BOTTOM
        available = max(0, top_clearance - band_bottom)
        text_zone = name_gap + 13 + image_gap
        img_h = fit_height(len(rows))
    img_h = max(14, min(46, img_h))

    line_y = band_bottom + name_gap + 13
    for row in rows:
        xs = _row_x_fractions(len(row), align)
        spacing = (xs[1] - xs[0]) if len(xs) > 1 else 0.26
        img_w = max(50, min(SIG_IMG_MAX_W, PAGE_W * spacing * 0.7))
        for sig, fx in zip(row, xs, strict=False):
            _draw_signature(
                c, PAGE_W * fx, line_y,
                sig.get('name'), sig.get('position'), color,
                sig.get('signature_url'),
                img_max_w=img_w, img_max_h=img_h,
                name_gap=name_gap, image_gap=image_gap,
            )
        line_y += image_gap + img_h + row_gap + name_gap + 13


def _draw_qr(c, url, x, y, size):
    qr = QrCodeWidget(url)
    bounds = qr.getBounds()
    w = bounds[2] - bounds[0]
    h = bounds[3] - bounds[1]
    drawing = Drawing(size, size, transform=[size / w, 0, 0, size / h, 0, 0])
    drawing.add(qr)
    renderPDF.draw(drawing, c, x, y)


def build_certificate_pdf(certificate):
    """Render one issued certificate to PDF bytes (landscape A4)."""
    snapshot = certificate.design_snapshot or {}
    member = certificate.member
    full_name = ' '.join(
        p for p in [member.first_name, member.middle_name, member.last_name] if p
    )
    color = _hex_color(snapshot.get('text_color'), '#0f172a')
    base_size = snapshot.get('font_size') or 16
    try:
        base_size = max(11, min(int(base_size), 30))
    except (TypeError, ValueError):
        base_size = 16

    buffer = io.BytesIO()
    c = pdf_canvas.Canvas(buffer, pagesize=(PAGE_W, PAGE_H))
    _draw_background(c, snapshot)

    align = _normalize_align(snapshot.get('text_align'))

    # Small three-line header (school / college / organization) at the top.
    header_lines = [
        (snapshot.get('header_school') or '').strip(),
        (snapshot.get('header_college') or '').strip(),
        (snapshot.get('header_organization') or '').strip(),
    ]
    header_lines = [line for line in header_lines if line]
    if header_lines:
        c.setFont(SANS, 10)
        c.setFillColor(color)
        header_y = PAGE_H - EDGE_PADDING
        for line in header_lines:
            _draw_aligned(c, line, header_y, align)
            header_y -= 13

    content_top = PAGE_H - TITLE_TOP
    title_size = max(30, min(base_size * 2.2, 52))

    c.setFillColor(color)
    c.setFont(SERIF_BOLD, title_size)
    _draw_aligned(c, (snapshot.get('title') or 'Certificate').upper(), content_top, align)

    y = content_top - title_size - 30

    message = (snapshot.get('message') or '').strip()
    if message:
        y = _draw_text_block(
            c, message, SERIF, base_size, color, y, PAGE_W - 2 * CONTENT_MARGIN,
            base_size + 6, align,
        )
        y -= 14

    c.setFillColor(color)
    presented_to = (
        snapshot.get('presented_to_text') or 'This certificate is proudly presented to'
    ).strip()
    if presented_to:
        y = _draw_text_block(
            c, presented_to, SANS, 11, color, y, PAGE_W - 2 * CONTENT_MARGIN, 14, align
        )
        y -= 32
    else:
        y -= 46

    name_size = max(24, min(base_size * 1.9, 40))
    c.setFont(SERIF_ITALIC, name_size)
    _draw_aligned(c, full_name, y, align)
    y -= name_size + 34

    for_text = (snapshot.get('for_text') or 'for participating in').strip()
    if for_text:
        y = _draw_text_block(
            c, for_text, SANS, 11, color, y, PAGE_W - 2 * CONTENT_MARGIN, 14, align
        )
        y -= 16
    else:
        y -= 30

    c.setFont(SERIF_BOLD, min(base_size + 4, 26))
    y = _draw_text_block(
        c, certificate.event_name, SERIF_BOLD, min(base_size + 4, 26),
        color, y, PAGE_W - 2 * CONTENT_MARGIN, min(base_size + 10, 32), align,
    )
    y -= 12

    c.setFont(SANS, 10.5)
    _draw_aligned(c, f"held on {certificate.event_date.strftime('%B %d, %Y')}", y, align)

    # Signatories (bottom band); 2 per row, clamped below the text above it ----
    signatories = list(snapshot.get('signatories') or [])
    if not signatories:
        # Backwards compatibility with snapshots issued before the list field.
        if snapshot.get('signatory_name'):
            signatories.append({
                'name': snapshot.get('signatory_name'),
                'position': snapshot.get('signatory_position'),
                'signature_url': snapshot.get('signature_url'),
            })
        if snapshot.get('second_signatory_name'):
            signatories.append({
                'name': snapshot.get('second_signatory_name'),
                'position': snapshot.get('second_signatory_position'),
                'signature_url': '',
            })

    if signatories:
        _draw_signatory_band(
            c, signatories, align, color, top_clearance=y - SIGNATORY_CLEARANCE
        )

    # QR verification block (bottom-right) ---------------------------------
    verify_url = f"{getattr(settings, 'FRONTEND_URL', '')}/verify/{certificate.verification_code}"
    qr_x = PAGE_W - QR_RIGHT_MARGIN - QR_SIZE
    _draw_qr(c, verify_url, qr_x, EDGE_PADDING, QR_SIZE)
    c.setFont(SANS, 6.5)
    c.setFillColor(color)
    c.drawRightString(
        PAGE_W - QR_RIGHT_MARGIN - QR_SIZE / 2,
        EDGE_PADDING - 12,
        f"Verify: {certificate.verification_code}",
    )

    c.showPage()
    c.save()
    return buffer.getvalue()
