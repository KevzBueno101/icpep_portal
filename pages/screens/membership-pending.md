---
title: Screen — Membership Pending
description: The waiting screen shown after registration or renewal while awaiting admin approval
---

# Membership Pending (`/membership-pending`)

## File

`frontend/src/pages/auth/MembershipPending.jsx`

## What it shows

A "your application is under review" screen that **polls approval status every 8 seconds** via `GET /api/auth/me/`. Also hosts the **renewal modal** for members whose status is EXPIRED/REJECTED.

## How to move around

| State | Behavior |
|---|---|
| PENDING | Spinner + "waiting for approval"; auto-redirects to `/member/dashboard` the moment status becomes APPROVED |
| REJECTED | Shows the admin's message; offers renewal |
| EXPIRED | Offers renewal |
| Renewal modal | Choose year level, payment method (GCash default), upload proof + COE/ID → `POST /api/members/renew/` |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/auth/me/` | Poll membership status (every 8s) |
| `POST /api/members/renew/` | Submit renewal → PENDING again |

## Notes

- The poll stops when the component unmounts (e.g., after approval redirect).
- This screen is the member's waiting area both after **registration** and after **renewal**.

## Preview

![Renewal form preview](/images/renewal-form.svg)

## Related Pages

- [Flow: Member Registration](/flows/member-registration)
- [Flow: Member Renewal](/flows/member-renewal)
- [Flow: Member Approval & E-Receipt](/flows/member-approval-receipt)
