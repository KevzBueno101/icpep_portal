---
title: Screen — Admin Officers Accounts
description: Officer accounts CRUD with drag-to-reorder roster
---

# Admin Officers Accounts (`/admin/officers-accounts`)

## File

`frontend/src/pages/admin/AdminOfficersAccounts.jsx`

## What it shows

- **Officer account CRUD** — create, edit, delete officer accounts
- **OfficerCard** roster with **drag-to-reorder** (`SortableList`)
- Role note: backend stores officer accounts with `role='ADMIN'`

## How to move around

| Action | Result |
|---|---|
| Create officer | `POST /api/users/admins/create/` (President only) |
| Edit officer | `PATCH /api/users/admins/<pk>/` |
| Delete officer | `DELETE /api/users/admins/<pk>/` |
| Reorder roster | `POST /api/users/officers/reorder/` |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/users/admins/` | List officer accounts |
| `POST /api/users/admins/create/` | Create (President only) |
| `POST /api/users/officers/reorder/` | Persist `display_order` |

## Notes

- Uses `OfficersProvider` for live roster updates via WebSocket.
- Each officer has an `officer_id` auto-generated (`ICPEP-0001`…) and an optional officer ID card (see [Screen: Admin Officer ID](/screens/admin-officer-id)).

## Preview

![Admin officers preview](/images/admin-officers.svg)

## Related Pages

- [Screen: Admin Admins](/screens/admin-admins)
- [Screen: Admin Officer ID](/screens/admin-officer-id)
- [Flow: Admin Access Request](/flows/admin-access-request)
- [Flow: Realtime WebSockets](/flows/realtime-websockets)
