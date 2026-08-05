---
title: Screen — Member Announcements
description: Announcement list for logged-in members, with search, category filter, and push toggle
---

# Member Announcements (`/member/announcements`)

## File

`frontend/src/pages/member/MemberAnnouncements.jsx`

## What it shows

The member-scoped announcement list:

- Search box (filters by title/body)
- Category filter (`announcement`, `achievement`, `update`, `opportunity`, `event`)
- Announcement cards with images
- **Push notification toggle** (top)

## How to move around

| Action | Result |
|---|---|
| Type in search | Live-filters the list |
| Pick a category | Filters list |
| Click an announcement | Opens detail (with image lightbox) |
| Toggle **Enable Notifications** | Requests permission + subscribes (see below) |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/announcements/?include_members_only=1` | List (includes members-only for members) |
| `GET /api/push/vapid-key/` | Push setup |
| `POST /api/push/subscribe/` | Save device subscription (authenticated) |

## Push toggle behavior

- Uses `NotificationToggle` (`frontend/src/components/NotificationToggle.jsx`).
- If the session is stale, the axios interceptor redirects to login instead of showing a raw 401 toast.
- If the backend has no push app live (404) or no VAPID keys (503), a friendly toast explains push is unavailable.

## Notes

- List refreshes on `announcementUpdated` / `announcementDeleted` events.
- Members-only announcements are only visible here (and via the `include_members_only` flag), not on the public landing feed.

## Preview

![Announcements feed preview](/images/announcements-feed.svg)

## Related Pages

- [Screen: Admin Announcement](/screens/admin-announcement)
- [Flow: Announcements & Push](/flows/announcements-push)
- [User Guide: Announcements](/user-guide/announcements)
