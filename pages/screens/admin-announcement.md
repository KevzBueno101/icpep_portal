---
title: Screen — Admin Announcements
description: Announcement CRUD manager with categories, pinning, publishing, and image uploads
---

# Admin Announcements (`/admin/announcement`)

## File

`frontend/src/pages/admin/placeholder/AdminAnnouncement.jsx`

## What it shows

The announcement manager:

- Announcement list (with search/filter)
- **Create/edit form** — title, body, category, pinned, published, members-only
- **Image uploads** per announcement
- **Drag-to-reorder** (`SortableList`)
- Expanded view

## How to move around

| Action | Result |
|---|---|
| Create announcement | `POST /api/announcements/admin/` |
| Edit / delete | `PUT` / `PATCH` / `DELETE /api/announcements/admin/<id>/` |
| Upload images | `POST /api/announcements/admin/<id>/images/` |
| Delete image | `DELETE /api/announcements/admin/images/<image_id>/` |
| Reorder | `POST /api/announcements/admin/reorder/` |

## Categories

`announcement`, `achievement`, `update`, `opportunity`, `event`

## Publishing & push

- If **published** at creation, the backend fires push notifications in a background thread (see [Announcements & Push flow](/flows/announcements-push)).
- Members-only announcements are hidden from the public feed.

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/announcements/admin/` | List all (incl. drafts) |
| `POST /api/announcements/admin/` | Create (triggers push if published) |
| `POST /api/announcements/admin/<id>/images/` | Upload images |

## Preview

![Admin announcements preview](/images/admin-announcements.svg)

![Create announcement form preview](/images/admin-announcement-form.svg)

## Related Pages

- [Screen: Member Announcements](/screens/member-announcements)
- [Flow: Announcements & Push](/flows/announcements-push)
- [Admin Guide: Announcements](/admin-guide/announcements)
