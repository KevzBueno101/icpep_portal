---
title: Screen — Landing Page
description: Public landing page walkthrough, including the hidden 5-tap admin gesture
---

# Landing Page (`/landing`)

## File

`frontend/src/pages/landing/Landing.jsx` (+ section components in `pages/landing/`)

## What it shows

The marketing/entry page for visitors. Composes, in order:

1. **Navbar** — logo, links, **Install App** button
2. **Hero section** — dark gradient hero, particles canvas, CatSU / ICpEP.SE / CEA logos, **Join** CTA, pinned announcements (up to 2)
3. **Announcement feed** — featured + recent published announcements; hosts the **notification toggle**
4. **Feature section** — "How to be a member" (Register → Wait for Activation → Verify; PHP 25 fee, 1-year validity, 1–5 day activation)
5. **Milestones timeline** — chapter history with category colors
6. **Officers roster** — leadership board (from `/users/officers/roster/`)
7. **Sponsorship section** — partnership pitch + mailto contact
8. **Footer** + moving logo text marquee

## How to move around

| Action | Result |
|---|---|
| Click **Join** | Goes to `/register` |
| Click a milestone | Opens `/milestone/:id` |
| Click an announcement | Opens `/announcement/:id` |
| Tap the **ICpEP.SE logo 5 times** within 2.5s | Opens the hidden `/admin-portal/login` |
| Click **Install App** | Triggers the PWA install prompt (iOS shows instructions modal) |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/announcements/` | Public feed (published only) |
| `GET /api/milestones/` | Public timeline |
| `GET /api/users/officers/roster/` | Leadership board (public) |
| `GET /api/push/vapid-key/` | Enable push (toggle) |

## Notes

- The **5-tap logo gesture** is tracked in `sessionStorage` (`icpep-logo-taps`) — it's the only way into the admin portal.
- Announcements refresh live via `announcementUpdated` / `announcementDeleted` window events.
- The `NetworkStatus` banner ("showing cached data") appears here when offline.

## Preview

![Landing page preview](/images/announcements-feed.svg)

## Related Pages

- [Screen: Register](/screens/register)
- [Flow: Member Registration](/flows/member-registration)
- [Screen: Admin Login](/screens/admin-login)
