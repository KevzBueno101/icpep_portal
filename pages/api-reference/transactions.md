---
title: Transactions API
description: Payment transaction and e-receipt endpoints
---

# Transactions API

Base path: `/api/members/transactions/`

## List Transactions

```bash
GET /api/members/transactions/
Authorization: Bearer <access_token>
```

**Query Parameters**:
| Param | Type | Description |
|---|---|---|
| `member` | integer | Filter by member ID (admin only) |

**Response** `200 OK`:
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "member": {
        "id": 1,
        "first_name": "John",
        "last_name": "Doe"
      },
      "transaction_type": "registration",
      "payment_method": "gcash",
      "payment_proof_image": "https://res.cloudinary.com/...",
      "receipt_image": "https://res.cloudinary.com/...",
      "status": "VERIFIED",
      "reference_number": "ICPEP-2026-0001",
      "academic_year": "2025-2026",
      "approved_by_name": "Admin User",
      "created_at": "2026-07-19T10:00:00Z"
    }
  ]
}
```

### For the Authenticated Member

When called without the `member` parameter, the endpoint returns transactions for the currently authenticated member:

```bash
GET /api/members/transactions/
Authorization: Bearer <access_token>
```

Returns only the member's own transactions.

### For Admin Viewing a Specific Member

Admins can filter by any member ID:

```bash
GET /api/members/transactions/?member=5
Authorization: Bearer <access_token>
```

Returns transactions for member ID 5.

## Transaction Fields

| Field | Type | Description |
|---|---|---|
| `id` | integer | Primary key |
| `member` | object | Member info (id, first_name, last_name) |
| `transaction_type` | string | `registration` or `renewal` |
| `payment_method` | string | `gcash` or `on_hand` |
| `payment_proof_image` | string (URL) | Cloudinary URL of payment proof |
| `receipt_image` | string (URL) | Cloudinary URL of generated e-receipt |
| `status` | string | `VERIFIED`, `PENDING`, or `REJECTED` |
| `reference_number` | string | Format: `ICPEP-{YEAR}-{SEQUENTIAL:04d}` |
| `academic_year` | string | e.g., `2025-2026` |
| `approved_by_name` | string | Full name of approving admin |
| `created_at` | datetime | Transaction timestamp |

## E-Receipt Generation

E-receipts are **auto-generated** when an admin approves a member via `POST /api/members/<id>/approve/`.

The receipt PNG includes:
- ICPEP Logo
- Reference number
- Member name
- Approval date
- Transaction type
- Payment method
- Status (VERIFIED)
- Academic year
- Authorized signatory (approving admin)
- Payment proof thumbnail

Receipts are stored on Cloudinary and the URL is saved to the `receipt_image` field.
