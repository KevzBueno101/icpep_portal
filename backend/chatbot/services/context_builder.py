import logging
from typing import Optional

from django.contrib.auth import get_user_model

from announcements.models import Announcement
from about.models import AboutSection
from milestones.models import Milestone
from members.models import MemberProfile, PaymentSettings

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """You are the ICPEP Membership Portal Assistant, an AI chatbot for the ICPEP-CatSU (Institute of Computer Engineers of the Philippines - Student Edition, Catanduanes State University Chapter) portal.

## Organization Overview
- **Name**: ICPEP.SE - CatSU Chapter (Institute of Computer Engineers of the Philippines - Student Edition)
- **Purpose**: Professional organization for Computer Engineering (BS CpE) students
- **Affiliation**: ICPEP National, College of Engineering and Architecture, Catanduanes State University
- **Contact email**: icpep.se.catsuchapter@gmail.com

## Portal Developer
- **Developer**: Kevin Bueno (GitHub: KevzBueno101) — built and maintains the ICPEP-SE CatSU portal.
- If asked who made/developed the portal, credit Kevin Bueno (KevzBueno101).

## Membership Plans & Fees (IMPORTANT - use these exact amounts). Valid as of the current academic semester/year. 
The portal has exactly two membership plans, paid via GCash or on-hand (in person to an officer):
- **Regular Membership — ₱25** : standard membership.
- **Membership Plus — ₱60** : standard membership with inclusions & add-ons.

### Membership Plus inclusions
1. Laminated ID card
2. Documentary stamped
3. Badge pin
4. Stickers

### Sign-up process
Register on the portal → fill the membership form → choose plan (₱25 Regular or ₱60 Membership Plus) → choose payment method (GCash or On-hand) → submit proof of payment (and COE ID image where required) → wait for admin approval (typically 1-3 business days). Once approved you can access the Digital ID.

## Digital ID Card
- Your official digital membership pass, shown in the member dashboard and at the Digital ID page.
- Contains: full name, course (BS CpE), year level, student number, block/section, academic year, and a QR verification code.
- You can download it as a PNG (Download ID Card button) and print it — it will be used for the future attendance system.
- The card shows **VERIFIED** when your payment and student number have been verified by the membership director or assigned officer. Keep your registered payment and student number verified to keep it showing VERIFIED.
- A "Membership Plus" badge and the inclusions (laminated ID, documentary stamp, badge pin, stickers) are shown on the dashboard for ₱60 members.

## Member Benefits
- Official Digital ID
- Events & Activities: access to ICPEP.SE seminars, trainings, and organization activities.
- Event discounts: free or highly-discounted entry to local CpE seminars, programming bootcamps, workshops, and team buildings.
- CpE Contests: regional/national programming contests, tech quiz bowls, and design project showcases.
- Academic support: peer study groups, compiler setups, review repositories, and programming tutorial materials.
- Industry networking: connect with professional computer engineers, chapter alumni, guest speakers, and partner tech recruiters.
- Discounts & Merch: exclusive offers on organization merchandise and event registration.

## Key Policies
- Non-transferability: membership details and cards are unique to you and cannot be shared or transferred.
- Refund policy: all registration and renewal fees are final, non-refundable, and non-transferable.
- Organization conduct: members must adhere to the ICPEP.SE constitution and follow active department/laboratory rules.
- Active ID status: to keep your Digital ID VERIFIED, your registered payment and student number must be verified.

## Frequently Asked Questions

**Q: How do I become a member?**
A: Register on the portal → fill the form → choose ₱25 (Regular) or ₱60 (Membership Plus) → pay via GCash or on-hand → submit proof of payment → wait for approval (1-3 business days).

**Q: What's the difference between Regular and Membership Plus?**
A: Regular is ₱25 (standard membership). Membership Plus is ₱60 and adds inclusions: laminated ID card, documentary stamp, badge pin, and stickers.

**Q: How do I pay?**
A: Two options: GCash (send to the GCash account shown in the registration form) or On-hand (hand the fee personally to an officer).

**Q: Why is my Digital ID not showing VERIFIED?**
A: Your payment and student number must be verified by the membership director or assigned officer. If you just registered, wait a few days or contact an officer.

**Q: How do I download my Digital ID?**
A: Open the Digital ID page, then tap the "Download ID Card (PNG)" button. Print it for offline/physical use.

**Q: What if I have a payment/portal problem?**
A: Use the Feedback button (left side of the portal) or email icpep.se.catsuchapter@gmail.com. For technical portal issues, use "Report Bug".

**Q: Where can I see announcements?**
A: The Announcements section of the portal, visible to members.

## Escalation Rules
- **Payment issues** → email icpep.se.catsuchapter@gmail.com or contact an officer
- **Technical portal issues** → use "Report Bug" in the portal
- **Account/membership concerns** → email icpep.se.catsuchapter@gmail.com
- **Urgent matters** → contact an officer directly

## Response Guidelines
1. Be friendly, professional, and concise.
2. Use correct facts from this prompt — never invent fees or policies. If unsure, say "Let me check..." and suggest contacting an officer.
3. Never share personal contact info of officers.
4. For specific account issues, ask the user to log in and check their dashboard.
5. If the question is outside scope, politely redirect to email/officer contact.
6. Use bullet points for readability.
7. Mention relevant portal features (Digital ID, announcements, feedback, report bug) where helpful.
8. The user may write in Tagalog/Taglish — answer in the same language they use.

Current date context: The assistant doesn't have real-time date access. For time-sensitive info, advise checking the Announcements section of the portal.
"""

# In-memory session store for stateless context (optional, for multi-turn)
# In production, consider Redis or database. For now, simple dict.
_session_contexts = {}


def _truncate(text: str, limit: int) -> str:
    """Trim text to `limit` chars with an ellipsis."""
    text = (text or '').strip()
    if len(text) <= limit:
        return text
    return text[: limit - 1].rstrip() + '…'


def _is_approved_member(user) -> bool:
    """True if the user has an APPROVED member profile."""
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    return MemberProfile.objects.filter(user=user, membership_status='APPROVED').exists()


def _officers_section() -> str:
    """Current officers, mirroring the public roster logic in users/views.py."""
    User = get_user_model()
    leadership_order = ['President', 'Vice President', 'Secretary', 'Treasurer', 'Auditor']
    qs = User.objects.filter(
        role__in=['OFFICER', 'ADMIN'],
        registration_status='APPROVED',
        is_active=True,
    ).exclude(position__isnull=True).exclude(position='').exclude(position__iexact='NONE')

    rows = []
    for u in qs:
        pos = (u.position or '').strip()
        pos_lower = pos.lower()
        if 'vice president' in pos_lower or 'vice pres' in pos_lower:
            canon = 'Vice President'
        elif 'president' in pos_lower:
            canon = 'President'
        elif 'secretary' in pos_lower:
            canon = 'Secretary'
        elif 'treasurer' in pos_lower:
            canon = 'Treasurer'
        elif 'auditor' in pos_lower:
            canon = 'Auditor'
        else:
            canon = pos
        full_name = f"{getattr(u, 'first_name', '') or ''} {getattr(u, 'last_name', '') or ''}".strip()
        if full_name and canon:
            rows.append((leadership_order.index(canon) if canon in leadership_order else 999, canon, full_name))

    rows.sort(key=lambda r: (r[0], len(r[1])))
    if not rows:
        return ''
    lines = [f"- {canon}: {name}" for _, canon, name in rows[:8]]
    return "**Current Officers (from portal):**\n" + "\n".join(lines)


def _announcements_section(user) -> str:
    """Latest published announcements. members_only are gated to approved members."""
    qs = Announcement.objects.filter(is_published=True).order_by('display_order', '-created_at')[:8]
    rows = []
    for ann in qs:
        if ann.members_only and not _is_approved_member(user):
            continue
        date = ann.created_at.strftime('%b %d, %Y') if ann.created_at else ''
        snippet = _truncate(ann.body, 160)
        rows.append(f"- [{ann.category}] {ann.title} ({date}): {snippet}")
        if len(rows) >= 5:
            break
    if not rows:
        return ''
    return "**Latest Announcements (from portal):**\n" + "\n".join(rows)


def _about_section() -> str:
    """Published Mission/Vision/Goals/History sections."""
    qs = AboutSection.objects.filter(is_published=True).order_by('display_order', 'created_at')[:8]
    rows = []
    for sec in qs:
        if sec.section_type not in ('MISSION', 'VISION', 'GOALS', 'HISTORY'):
            continue
        body = _truncate(sec.body or sec.document_name or 'No details provided.', 220)
        label = dict(AboutSection.SectionType.choices).get(sec.section_type, sec.title)
        rows.append(f"- **{label}**: {body}")
        if len(rows) >= 4:
            break
    if not rows:
        return ''
    return "**About the Organization (from portal):**\n" + "\n".join(rows)


def _milestones_section() -> str:
    """Top recent milestones (achievements, recognitions, events)."""
    qs = Milestone.objects.order_by('display_order', '-date')[:6]
    rows = []
    for m in qs:
        date = m.date.strftime('%b %Y') if m.date else ''
        desc = _truncate(m.description, 140)
        rows.append(f"- {m.title} ({date}): {desc}")
    if not rows:
        return ''
    return "**Recent Milestones / Achievements (from portal):**\n" + "\n".join(rows)


def _payment_section() -> str:
    """Current GCash payment details."""
    settings_obj = PaymentSettings.objects.filter(id=1).first()
    if not settings_obj:
        return ''
    return (
        "**Current Payment Details (from portal):**\n"
        f"- GCash Name: {settings_obj.gcash_name or '—'}\n"
        f"- GCash Number: {settings_obj.gcash_number or '—'}"
    )


def _live_data_section(user) -> str:
    """Assemble the LIVE PORTAL DATA block. Each section is isolated so a
    failure in one never breaks the others."""
    parts = []
    builders = [_officers_section, _about_section, _milestones_section, _payment_section]
    for build in builders:
        try:
            section = build()
            if section:
                parts.append(section)
        except Exception:
            logger.exception(f'Chatbot live data section "{build.__name__}" failed; skipped.')
    try:
        ann = _announcements_section(user)
        if ann:
            parts.append(ann)
    except Exception:
        logger.exception('Chatbot live data announcements failed; skipped.')

    if not parts:
        return ''
    block = "\n\n# 📡 LIVE PORTAL DATA (fetched from the portal database just now — treat this as the source of truth)\n"
    block += "\n\n".join(parts)
    block += (
        "\n\nUse the LIVE PORTAL DATA above as the primary source of truth when answering. "
        "If the answer is not in the live data, you may use the general organization info below. "
        "If it is still not covered, say you'll check with the officers and point to icpep.se.catsuchapter@gmail.com."
    )
    return block


def build_context(user, message: str, session_id: Optional[str] = None) -> str:
    """
    Build the full context for the chatbot including system prompt.
    Injects live portal data (officers, announcements, about, milestones,
    payment details) retrieved from the database at request time.
    """
    user_context = ""
    if user and user.is_authenticated:
        user_context = f"\n\nCurrent user: {user.email} (Role: {getattr(user, 'role', 'N/A')}, Access: {getattr(user, 'access_level', 'N/A')})"

    return SYSTEM_PROMPT + _live_data_section(user) + user_context


def get_session_history(session_id: str) -> list:
    """Retrieve session history (placeholder for future Redis/DB implementation)."""
    return _session_contexts.get(session_id, [])


def update_session_history(session_id: str, user_msg: str, bot_response: str):
    """Update session history (placeholder)."""
    if session_id not in _session_contexts:
        _session_contexts[session_id] = []
    _session_contexts[session_id].extend([
        {'role': 'user', 'content': user_msg},
        {'role': 'assistant', 'content': bot_response}
    ])
    # Keep last 10 exchanges
    if len(_session_contexts[session_id]) > 20:
        _session_contexts[session_id] = _session_contexts[session_id][-20:]