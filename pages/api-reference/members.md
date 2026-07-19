---
title: Members API
description: Member management endpoints
---

# Members API

Base path: `/api/members/`

> All endpoints require `Authorization: Bearer <access_token>` header unless noted.

## List Members

```bash
GET /api/members/
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Param | Type | Description |
|---|---|---|
| `search` | string | Filter by name or email |
| `status` | string | Filter by status (PENDING, APPROVED, REJECTED, EXPIRED) |
| `year` | string | Filter by academic year |
| `page` | integer | Page number (default: 1) |

**Response** `200 OK`:
```json
{
  "count": 50,
  "next": "https://api.example.com/api/members/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "username": "john.doe",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "status": "APPROVED",
      "school": "University of Example",
      "course": "BSIT",
      "year": "3rd Year",
      "profile_picture": "https://res.cloudinary.com/...",
      "academic_year": "2025-2026"
    }
  ]
}
```

## Create Member

```bash
POST /api/members/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "username": "jane.doe",
  "email": "jane@example.com",
  "password": "securepass123",
  "first_name": "Jane",
  "last_name": "Doe",
  "contact_number": "09181234567",
  "school": "University of Example",
  "course": "BSIT",
  "year": "2nd Year",
  "address": "456 Oak St",
  "payment_method": "on_hand",
  "profile_picture": <file>
}
```

**Response** `201 Created`:
```json
{
  "id": 2,
  "username": "jane.doe",
  "email": "jane@example.com",
  "status": "PENDING",
  "message": "Member created successfully."
}
```

## Retrieve Member

```bash
GET /api/members/<id>/
Authorization: Bearer <access_token>
```

**Response** `200 OK`:
```json
{
  "id": 1,
  "username": "john.doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "status": "APPROVED",
  "school": "University of Example",
  "course": "BSIT",
  "year": "3rd Year",
  "contact_number": "09171234567",
  "address": "123 Main St",
  "profile_picture": "https://res.cloudinary.com/...",
  "payment_proof_image": "https://res.cloudinary.com/...",
  "payment_method": "gcash",
  "academic_year": "2025-2026",
  "rejection_message": null,
  "is_officer": false
}
```

## Update Member

```bash
PATCH /api/members/<id>/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "first_name": "Johnny",
  "contact_number": "09199999999"
}
```

**Response** `200 OK`: Updated member object.

## Delete Member

```bash
DELETE /api/members/<id>/
Authorization: Bearer <access_token>
```

**Response** `204 No Content`

## Approve Member

```bash
POST /api/members/<id>/approve/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "action": "approve",
  "message": "Welcome to ICPEP!"
}
```

**Response** `200 OK`:
```json
{
  "message": "Member approved successfully",
  "status": "APPROVED",
  "reference_number": "ICPEP-2026-0001"
}
```

Also sends `action: "reject"` to reject with an optional message.

## Renew Member

```bash
POST /api/members/renew/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "payment_method": "gcash",
  "payment_proof_image": <file>
}
```

**Response** `200 OK`:
```json
{
  "message": "Renewal submitted. Awaiting approval.",
  "status": "PENDING"
}
```

## Renew All Members

```bash
POST /api/members/renew-all/
Authorization: Bearer <access_token>
```

**Response** `200 OK`:
```json
{
  "message": "Year-end renewal initiated for all members."
}
```

## Payment Settings

```bash
GET /api/members/payment-settings/
```

**Response** `200 OK`:
```json
{
  "gcash_number": "09171234567",
  "gcash_name": "ICPEP Chapter"
}
```

```bash
PATCH /api/members/payment-settings/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "gcash_number": "09189999999",
  "gcash_name": "ICPEP Treasurer"
}
```

## Transactions

See [Transactions API](/api-reference/transactions).
