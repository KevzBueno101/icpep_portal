---
title: Admins API
description: Admin and officer management endpoints
---

# Admins API

Base path: `/api/users/admins/`

> All endpoints require `Authorization: Bearer <access_token>` header.

## List Admins

```bash
GET /api/users/admins/
Authorization: Bearer <access_token>
```

**Response** `200 OK`:
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@icpep.org",
      "first_name": "Admin",
      "last_name": "User",
      "role": "admin",
      "access_level": "FULL_CONTROL",
      "position": "President",
      "is_active": true
    }
  ]
}
```

## Get Admin Detail

```bash
GET /api/users/admins/<id>/
Authorization: Bearer <access_token>
```

**Response** `200 OK`: Single admin object with all fields.

## Create Admin Account

```bash
POST /api/users/admins/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "newadmin",
  "email": "newadmin@icpep.org",
  "password": "securepass123",
  "first_name": "New",
  "last_name": "Admin",
  "role": "admin",
  "access_level": "MEMBERSHIP"
}
```

## Update Admin

```bash
PATCH /api/users/admins/<id>/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Updated",
  "access_level": "FULL_CONTROL"
}
```

## Delete Admin

```bash
DELETE /api/users/admins/<id>/
Authorization: Bearer <access_token>
```

**Response** `204 No Content`

## Assign Role

```bash
PATCH /api/users/admins/<id>/assign-role/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role": "admin",
  "access_level": "MEMBERSHIP"
}
```

## Pending Admin Requests

```bash
GET /api/users/admins/pending/
Authorization: Bearer <access_token>
```

## Approve Admin Request

```bash
POST /api/users/admins/<id>/approve/
Authorization: Bearer <access_token>
```

## Reject Admin Request

```bash
POST /api/users/admins/<id>/reject/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Insufficient qualifications"
}
```

## Create Officer Account

```bash
POST /api/users/admins/create/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "officer1",
  "email": "officer1@icpep.org",
  "password": "securepass123",
  "first_name": "Officer",
  "last_name": "One",
  "role": "officer",
  "position": "Secretary"
}
```

## Admin Profile

```bash
GET /api/users/admin/profile/
Authorization: Bearer <access_token>
```

**Response** `200 OK`:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@icpep.org",
  "first_name": "Admin",
  "last_name": "User",
  "role": "admin",
  "access_level": "FULL_CONTROL",
  "position": "President"
}
```

## Officers Roster

```bash
GET /api/users/officers/roster/
Authorization: Bearer <access_token>
```

**Response** `200 OK`:
```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "member": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe",
        "profile_picture": "https://res.cloudinary.com/..."
      },
      "position": "President",
      "access_level": "FULL_CONTROL"
    }
  ]
}
```
