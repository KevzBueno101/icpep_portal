---
title: Screen — Admin Membership Verify
description: Review a member's documents and approve or reject their application
---

# Admin Membership Verify (`/admin/membership/:id/verify`)

## File

`frontend/src/pages/admin/AdminMembershipVerify.jsx`

## What it shows

A single member's verification screen:

- **Payment proof** image
- **COE / ID** document image
- Member details
- **Approve** / **Reject** actions with optional admin message

## How to move around

| Action | Result |
|---|---|
| Inspect payment proof + COE/ID | Images resolved via `VITE_BACKEND_URL` |
| **Approve** (+ optional message) | `POST /api/members/<id>/approve/` → creates transaction + e-receipt |
| **Reject** (+ optional message) | `POST /api/members/<id>/approve/` with `REJECTED` |
| Back | Navigates to `/admin/membership` |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/members/<id>/` | Load member + documents |
| `POST /api/members/<id>/approve/` | Approve / reject |

## Notes

- Approval auto-generates the `PaymentTransaction` and the **e-receipt PNG** (see [Approval & E-Receipt flow](/flows/member-approval-receipt)).
- Dispatches `member-list-updated` so the membership table refreshes.

## Preview

![Admin verify preview](/images/admin-verify.svg)

## Related Pages

- [Screen: Admin Membership](/screens/admin-membership)
- [Flow: Member Approval & E-Receipt](/flows/member-approval-receipt)
- [Admin Guide: Membership](/admin-guide/membership)
