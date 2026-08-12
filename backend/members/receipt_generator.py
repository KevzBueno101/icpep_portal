import io
import os
import urllib.request

from django.conf import settings
from PIL import Image, ImageDraw, ImageFont


def _get_font(size, bold=False):
    """Try to load a TTF font; fall back to default bitmap font."""
    try:
        if bold:
            paths = [
                '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
                'C:/Windows/Fonts/arialbd.ttf',
                'C:/Windows/Fonts/arial.ttf',
            ]
        else:
            paths = [
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
                'C:/Windows/Fonts/arial.ttf',
            ]
        for p in paths:
            if os.path.exists(p):
                return ImageFont.truetype(p, size)
    except OSError:
        pass
    return ImageFont.load_default()


def _load_logo():
    logo_path = os.path.join(settings.BASE_DIR, 'static', 'icpep_logo.jpg')
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert('RGBA')
        logo.thumbnail((90, 90), Image.LANCZOS)
        return logo
    return None


def _load_image_from_url(url, max_size=(260, 260)):
    """Download an image from URL and return a Pillow Image thumbnail, or None."""
    if not url:
        return None
    try:
        resp = urllib.request.urlopen(url, timeout=10)
        data = resp.read()
        pil = Image.open(io.BytesIO(data)).convert('RGBA')
        pil.thumbnail(max_size, Image.LANCZOS)
        return pil
    except Exception:
        return None


def generate_receipt_png(transaction, member):
    """Generate a membership receipt PNG and return the raw bytes.

    Parameters
    ----------
    transaction : PaymentTransaction
        The transaction record (must have reference_number, created_at,
        transaction_type, payment_method, status, approved_by_name,
        approved_by_position).
    member : MemberProfile
        The member profile (for full name and payment_proof_image).

    Returns
    -------
    bytes
        PNG image as raw bytes, ready to upload to Cloudinary.
    """
    W, H = 800, 700
    bg_color = (255, 255, 255)
    text_color = (30, 30, 30)
    accent_color = (0, 31, 77)  # ICPEP navy
    subtle_color = (100, 116, 139)  # slate-500

    img = Image.new('RGB', (W, H), bg_color)
    draw = ImageDraw.Draw(img)

    font_sm = _get_font(13)
    font_md = _get_font(16)
    font_xl = _get_font(26, bold=True)

    # ── Border ──
    draw.rounded_rectangle([10, 10, W - 10, H - 10], radius=16, outline=accent_color, width=2)
    draw.rounded_rectangle([16, 16, W - 16, H - 16], radius=14, outline=accent_color, width=1)

    # ── Logo ──
    logo = _load_logo()
    if logo:
        img.paste(logo, (355, 40), logo)

    # ── Header text ──
    org_line1 = 'Institute of Computer Engineers of the Philippines'
    org_line2 = 'Student Edition — Catanduanes State University'
    draw.text((400, 135), org_line1, fill=accent_color, font=font_md, anchor='mt')
    draw.text((400, 158), org_line2, fill=subtle_color, font=font_sm, anchor='mt')

    # Separator
    draw.line([60, 178, W - 60, 178], fill=accent_color, width=1)

    # Title
    draw.text((400, 200), 'ACKNOWLEDGEMENT RECEIPT', fill=accent_color, font=font_xl, anchor='mt')

    # ── Body fields ──
    fields = [
        ('Reference No.',   transaction.reference_number),
        ('Member Name',     f"{member.first_name} {member.middle_name + ' ' if member.middle_name else ''}{member.last_name}"),
        ('Date',            transaction.created_at.strftime('%B %d, %Y')),
        ('Transaction',     transaction.get_transaction_type_display()),
        ('Payment Method',  transaction.get_payment_method_display()),
        ('Status',          'Verified' if transaction.status == 'VERIFIED' else 'Pending'),
        ('Membership Fee',  f"PHP {transaction.fee_amount}" if getattr(transaction, 'fee_amount', None) else '—'),
        ('Academic Year',   transaction.academic_year or '—'),
    ]

    y_start = 245
    col1_x = 120
    col2_x = 360
    row_h = 34

    for i, (label, value) in enumerate(fields):
        y = y_start + i * row_h
        draw.text((col1_x, y), label, fill=subtle_color, font=font_sm, anchor='lt')
        draw.text((col2_x, y), str(value), fill=text_color, font=font_md, anchor='lt')

    # ── Payment Proof thumbnail (right side) ──
    proof_url = member.payment_proof_image.url if member.payment_proof_image else None
    if not proof_url:
        # fallback: try from transaction
        proof_url = transaction.payment_proof_image.url if transaction.payment_proof_image else None
    proof_img = _load_image_from_url(proof_url)
    if proof_img:
        proof_x = 515
        proof_y = 245
        draw.rectangle([proof_x - 5, proof_y - 5, proof_x + proof_img.width + 5, proof_y + proof_img.height + 30],
                       outline=accent_color, width=1)
        img.paste(proof_img, (proof_x, proof_y), proof_img)
        draw.text((proof_x + proof_img.width // 2, proof_y + proof_img.height + 8),
                  'Payment Proof', fill=subtle_color, font=font_sm, anchor='mt')

    # ── Signature ──
    sig_y = 560
    draw.line([220, sig_y, 580, sig_y], fill=text_color, width=1)
    signatory = transaction.approved_by_name or ''
    position = (transaction.approved_by_position or '').strip()
    if position and position.upper() != 'NONE':
        signatory = f"{signatory} — {position}"
    if signatory:
        draw.text((400, sig_y - 5), signatory, fill=text_color, font=font_md, anchor='mb')
    draw.text((400, sig_y + 8), 'Authorized Signatory', fill=subtle_color, font=font_sm, anchor='mt')

    # ── Footer ──
    draw.text((400, H - 30), 'This is a system-generated receipt. Valid even without signature.', fill=subtle_color, font=font_sm, anchor='mt')

    buf = io.BytesIO()
    img.save(buf, format='PNG', optimize=True)
    return buf.getvalue()
