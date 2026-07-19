---
title: Announcements API
description: Announcement management endpoints
---

# Announcements API

Base path: `/api/announcements/`

## List Announcements (Public)

```bash
GET /api/announcements/
```

**Query Parameters**:
| Param | Type | Description |
|---|---|---|
| `category` | string | Filter by category |
| `search` | string | Search by title or content |
| `include_members_only` | integer | Set to `1` to include members-only posts |

**Response** `200 OK`:
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "title": "General Assembly",
      "content": "Please attend the upcoming general assembly...",
      "category": "Events",
      "image": null,
      "author_name": "Admin User",
      "pinned": true,
      "published": true,
      "members_only": false,
      "created_at": "2026-07-19T10:00:00Z"
    }
  ]
}
```

> **Members-Only**: Public requests (no auth) will never see `members_only=true` posts. Authenticated members must pass `?include_members_only=1`.

## Get Announcement Detail

```bash
GET /api/announcements/<id>/
```

**Response** `200 OK`:
```json
{
  "id": 1,
  "title": "General Assembly",
  "content": "<p>Please attend...</p>",
  "category": "Events",
  "images": [
    {
      "id": 1,
      "image": "https://res.cloudinary.com/...",
      "uploaded_at": "2026-07-19T10:00:00Z"
    }
  ],
  "author_name": "Admin User",
  "pinned": false,
  "published": true,
  "members_only": false,
  "created_at": "2026-07-19T10:00:00Z",
  "updated_at": "2026-07-19T10:30:00Z"
}
```

## List Announcements (Admin)

```bash
GET /api/announcements/admin/
Authorization: Bearer <access_token>
```

Returns all announcements including unpublished drafts and members-only posts.

## Create Announcement (Admin)

```bash
POST /api/announcements/admin/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "title": "New Event Announcement",
  "content": "Details about the event...",
  "category": "Events",
  "pinned": true,
  "published": true,
  "members_only": false
}
```

**Response** `201 Created`:
```json
{
  "id": 2,
  "title": "New Event Announcement",
  "content": "Details about the event...",
  "category": "Events",
  "pinned": true,
  "published": true,
  "members_only": false,
  "author_name": "Admin User"
}
```

## Update Announcement (Admin)

```bash
PATCH /api/announcements/admin/<id>/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "title": "Updated Title",
  "pinned": false
}
```

## Delete Announcement (Admin)

```bash
DELETE /api/announcements/admin/<id>/
Authorization: Bearer <access_token>
```

**Response** `204 No Content`

## Upload Image (Admin)

```bash
POST /api/announcements/admin/<announcement_id>/images/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "image": <file>
}
```

**Response** `201 Created`:
```json
{
  "id": 1,
  "image": "https://res.cloudinary.com/...",
  "uploaded_at": "2026-07-19T10:00:00Z"
}
```

## Delete Image (Admin)

```bash
DELETE /api/announcements/admin/images/<image_id>/
Authorization: Bearer <access_token>
```

**Response** `204 No Content`
