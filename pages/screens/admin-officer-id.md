---
title: Screen — Admin Officer ID
description: Official officer ID card with QR code and PNG download
---

# Admin Officer ID (`/admin/officer-id`)

## File

`frontend/src/pages/admin/OfficerIdCardPage.jsx` + `components/officer/OfficerIdCard.jsx`

## What it shows

The official **officer ID card** fed by `useAdminProfile` + the auth `user`:

- Officer name, position, officer ID
- **QR code** encoding `name=...|position=...|id=...|uid=...`
- **Download PNG** button

## How to move around

| Action | Result |
|---|---|
| View card | Auto-scales to container via `ResizeObserver` |
| Download PNG | Exported via **canvas drawing** (not DOM capture) at 3× → `ICpEP_Officer_Card_<officer_id>.png` |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/users/admin/profile/` | Officer profile data |

## Notes

- Unlike the member card (html2canvas), the officer card is **canvas-drawn** — no off-screen DOM block needed.
- Profile picture URL is cache-busted (`_cb=` query) via `useAdminProfile`.

## Related Pages

- [Screen: Member ID Card](/screens/member-id-card)
- [Screen: Admin Officers Accounts](/screens/admin-officers-accounts)
