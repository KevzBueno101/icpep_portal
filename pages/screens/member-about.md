---
title: Screen — Member About
description: Chapter mission, vision, values, and the live officers carousel
---

# Member About (`/member/about`)

## File

`frontend/src/pages/member/MemberAbout.jsx`

## What it shows

- Chapter **mission, vision, goals, history, and other organization sections**, rendered dynamically from the About Orgs API (see [Admin About Orgs](/screens/admin-about)).
- **OfficersCarousel** — the live leadership board driven by `OfficersProvider`
- Optional **View Document** button per section when admin attached a PDF/image (previews in a modal).

## How to move around

| Action | Result |
|---|---|
| Browse the carousel | Scrolls through current officers |
| Carousel updates | Refreshes in real time via WebSocket (`officers.roster.updated`) |
| View Document | Opens attached PDF (iframe) or image in a modal |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/about/` | Published about sections (AllowAny) |
| `GET /api/users/officers/roster/` | Public roster (AllowAny) |
| `ws://<host>/ws/officers/` | Live roster-update push |

## Content behavior

- Sections are seeded by a data migration (Mission / Vision / Core Values) and can be edited, reordered, or hidden by admins.
- If the API returns no published sections, the page falls back to the original hardcoded mission/vision/core-values text.

## Notes

- The carousel uses the same `OfficerCard` component as the landing page's leadership board.
- Roster changes by admins propagate to this page live (see [Realtime flow](/flows/realtime-websockets)).

## Related Pages

- [Flow: Realtime WebSockets](/flows/realtime-websockets)
- [Screen: Admin About Orgs](/screens/admin-about)
- [Admin Guide: About Orgs](/admin-guide/about-orgs)
- [Screen: Landing](/screens/landing)