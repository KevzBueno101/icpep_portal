---
title: Screen — Admin About Orgs
description: Admin CRUD for dynamic organization content sections
---

# Admin About Orgs (`/admin/about`)

## File

`frontend/src/pages/admin/AdminAbout.jsx`

## What it shows

- List of organization sections (Mission, Vision, Goals, History, Constitution & By-Laws, Resolutions, Custom) as sortable cards.
- **+ Add Section** opens a create form; **Edit** opens an inline card form.
- Each card shows type badge, title, content, attached-document badge, and draft status.
- Per-card actions: **Preview**, **Download**, **Publish/Unpublish**, **Edit**, **Delete**.

## Data flow

| Endpoint | Method | Use |
|---|---|---|
| `/api/about/admin/` | GET | List all sections (admin) |
| `/api/about/admin/` | POST | Create section (CanManageContent) |
| `/api/about/admin/<id>/` | PATCH | Update section / attach document |
| `/api/about/admin/<id>/` | DELETE | Delete section |
| `/api/about/admin/<id>/document/` | DELETE | Remove attached document |
| `/api/about/admin/reorder/` | POST | Save drag-order |

## Key behaviors

- Drag handles (`SortableList`) reorder sections; order persists to the backend and a **Saved** indicator flashes.
- Document upload is a single `.pdf` / `.png` / `.jpg` / `.jpeg`; PDFs preview in an `<iframe>`, images in an `<img>`.
- Deleting a section or removing a document is confirmed via `ConfirmModal` and logged to the audit trail.

## Related Pages

- [Admin Guide: About Orgs](/admin-guide/about-orgs)
- [API Reference: About](/api-reference/about)
- [Screen: Member About](/screens/member-about)