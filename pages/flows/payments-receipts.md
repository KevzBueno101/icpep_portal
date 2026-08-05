---
title: Flow — Payments & E-Receipts
description: How payments are captured, verified, and converted into receipts
---

# Payments & E-Receipts Flow

## Flowchart

```mermaid
flowchart TD
    A[PaymentSettings gcash_number + name] --> B[Registration / Renewal]
    B --> C{Payment method}
    C -- GCASH --> D[Member sees GCash number + name]
    D --> E[Member pays via GCash]
    C -- ON_HAND --> F[Member pays on hand]
    E --> G[Upload payment proof image]
    F --> G
    G --> H[status = PENDING]
    H --> I[Admin verify screen]
    I --> J{Approved?}
    J -- No --> K[REJECTED + message]
    J -- Yes --> L[Create PaymentTransaction]
    L --> M[type = REGISTRATION or RENEWAL]
    L --> N[method = GCASH or ON_HAND]
    L --> O[status = VERIFIED]
    L --> P[reference = ICPEP-YYYY-NNNN]
    M --> Q[Generate e-receipt PNG]
    N --> Q
    O --> Q
    P --> Q
    Q --> R[receipt_image stored on Cloudinary]
    R --> S[Member sees transaction in payment history]
    S --> T[Member can download/view receipt]
```

## Step-by-Step

1. The GCash number and GCash name shown to members are configured once by the admin (President/Treasurer) via `PATCH /api/members/payment-settings/`.
2. A member registering or renewing chooses **GCash** (default) or **ON_HAND**, pays, and uploads the payment proof image.
3. The transaction's initial state is **PENDING** until an admin approves the membership.
4. On approval, a verified `PaymentTransaction` is created (see [Approval & E-Receipt](/flows/member-approval-receipt)) and an e-receipt PNG is auto-generated and stored.
5. The member views the transaction + receipt under **Payment History** (`/api/members/transactions/`).

## Payment Settings

| Field | Description |
|---|---|
| `gcash_number` | GCash number displayed during payment |
| `gcash_name` | Name attached to the GCash account |

Only users with `has_payment_access` (President / Finance / Treasurer) can update these.

## Data

`PaymentTransaction` — see [Data Model](/data-model):

- `transaction_type`: `REGISTRATION` | `RENEWAL`
- `payment_method`: `ON_HAND` | `GCASH`
- `status`: `PENDING` | `VERIFIED`
- `reference_number`: `ICPEP-YYYY-NNNN` (unique)
- `receipt_image`: auto-generated on approval

## API Endpoints

| Endpoint | Method | Permission | Purpose |
|---|---|---|---|
| `/api/members/payment-settings/` | GET | AllowAny | Fetch GCash info |
| `/api/members/payment-settings/` | PATCH | President/Treasurer | Update GCash info |
| `/api/members/transactions/` | GET | IsAuthenticated | List own (or all, admin) transactions |

## Related Pages

- [Flow: Member Approval & E-Receipt](/flows/member-approval-receipt)
- [Flow: Member Renewal](/flows/member-renewal)
- [User Guide: Payments](/user-guide/payments)
- [Screens: Admin Dashboard (GCash settings)](/screens/admin-dashboard)
