---
title: Screen — Admin Achievements
description: Milestone/timeline CRUD with categories, image uploads, search, and reorder
---

# Admin Achievements (`/admin/achievements`)

## File

`frontend/src/pages/admin/AdminAchievements.jsx`

## What it shows

The **milestones** manager powering the public timeline:

- Milestone list with **search** + **category filter**
- **Pagination** (10 / page)
- **Create / edit / delete** with title, headline, description, content, date, category
- **Image uploads**
- **Drag-to-reorder** (`SortableList`)

## How to move around

| Action | Result |
|---|---|
| Create milestone | `POST /api/milestones/admin/` |
| Edit / delete | `PUT` / `PATCH` / `DELETE /api/milestones/admin/<id>/` |
| Upload images | `POST /api/milestones/admin/<id>/images/` |
| Delete image | `DELETE /api/milestones/admin/images/<image_id>/` |
| Reorder | `POST /api/milestones/admin/reorder/` |

## Categories

`founding`, `achievement`, `recognition`, `event`, `community`, `feature`

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/milestones/admin/` | Admin list |
| `POST /api/milestones/admin/` | Create |
| `GET /api/milestones/` | Public list (for preview) |

## Notes

- Public pages read `/api/milestones/` (AllowAny) and `/milestone/:id` for detail with an image lightbox.
- Reorder uses the shared `common.views.ReorderAPIView` (also used by announcements and officers).

## Related Pages

- [Screen: Landing (timeline)](/screens/landing)
- [Data Model: Milestone](/data-model)
- [Flow: Audit Logging](/flows/audit-logging)
