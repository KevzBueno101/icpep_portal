---
title: Screen — Member About
description: Chapter mission, vision, values, and the live officers carousel
---

# Member About (`/member/about`)

## File

`frontend/src/pages/member/MemberAbout.jsx`

## What it shows

- Chapter **mission, vision, and core values**
- **OfficersCarousel** — the live leadership board driven by `OfficersProvider`

## How to move around

| Action | Result |
|---|---|
| Browse the carousel | Scrolls through current officers |
| Carousel updates | Refreshes in real time via WebSocket (`officers.roster.updated`) |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/users/officers/roster/` | Public roster (AllowAny) |
| `ws://<host>/ws/officers/` | Live roster-update push |

## Notes

- The carousel uses the same `OfficerCard` component as the landing page's leadership board.
- Roster changes by admins propagate to this page live (see [Realtime flow](/flows/realtime-websockets)).

## Related Pages

- [Flow: Realtime WebSockets](/flows/realtime-websockets)
- [Screen: Landing](/screens/landing)
- [Screen: Admin Officers Accounts](/screens/admin-officers-accounts)
