---
title: About Orgs API
description: Dynamic organization content management endpoints
---

# About Orgs API

Base path: `/api/about/`

Manages dynamic chapter content shown on the member About page: Mission, Vision, Goals, History, Constitution & By-Laws, Resolutions, and custom sections.

## List Sections (Public)

```bash
GET /api/about/
```

Returns only published sections, ordered by `display_order`.

**Response** `200 OK`:
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "section_type": "MISSION",
      "section_type_display": "Mission",
      "title": "Our Mission",
      "body": "To provide a platform for student computer engineers...",
      "document_name": "",
      "document_url": null,
      "is_published": true,
      "display_order": 0,
      "created_at": "2026-08-31T00:00:00Z",
      "updated_at": "2026-08-31T00:00:00Z"
    }
  ]
}
```

## List Sections (Admin)

```bash
GET /api/about/admin/
Authorization: Bearer <access_token>
```

Returns all sections including drafts.

## Create Section (Admin)

```bash
POST /api/about/admin/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "section_type": "HISTORY",
  "title": "Chapter History",
  "body": "Founded in 2019...",
  "is_published": true
}
```

To attach a document (PDF or image), send `multipart/form-data` with the extra fields:

| Field | Type | Notes |
|---|---|---|
| `document` | file | `.pdf`, `.png`, `.jpg`, `.jpeg` |
| `document_name` | string | Display label for the file |

**Response** `201 Created`

## Update Section (Admin)

```bash
PATCH /api/about/admin/<id>/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Mission"
}
```

Use `multipart/form-data` to attach or replace a document in the same call.

## Delete Section (Admin)

```bash
DELETE /api/about/admin/<id>/
Authorization: Bearer <access_token>
```

**Response** `204 No Content`

## Remove Document (Admin)

```bash
DELETE /api/about/admin/<id>/document/
Authorization: Bearer <access_token>
```

Detaches and deletes the stored file; also logs an `ABOUT_SECTION_UPDATED` audit entry.

**Response** `204 No Content`

## Reorder Sections (Admin)

```bash
POST /api/about/admin/reorder/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "ordered_ids": [3, 1, 2]
}
```

Sets `display_order = 0, 1, 2, ...` by array position. Logs `ABOUT_SECTION_REORDERED`.

**Response** `200 OK`

## Permissions

| Endpoint | Permission |
|---|---|
| `GET /api/about/` | AllowAny |
| `GET /api/about/admin/...` | IsAdmin |
| `POST` / `PATCH` / `DELETE` (admin) | CanManageContent |

## Related Pages

- [Admin Guide: About Orgs](/admin-guide/about-orgs)
- [Screen: Admin About](/screens/admin-about)
- [Screen: Member About](/screens/member-about)