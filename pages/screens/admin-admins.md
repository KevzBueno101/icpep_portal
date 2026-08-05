---
title: Screen — Admin Admins
description: Admin/officer account management, roles, access levels, and pending access requests
---

# Admin Admins (`/admin/admins`)

## File

`frontend/src/pages/admin/placeholder/AdminAdmins.jsx`

## What it shows

- **Admins/officers management** — create, edit, delete accounts
- **Role options** — `ADMIN` / `OFFICER`
- **Year level options** (1–4)
- **Pending access-request approval** (from the [access request flow](/flows/admin-access-request))
- **Access levels** — `FULL_CONTROL` / `MEMBERSHIP` / `RESTRICTED`
- Broken-image fallback for avatars

## How to move around

| Action | Result |
|---|---|
| Create admin/officer | `POST /api/users/admins/` |
| Edit account | `PATCH /api/users/admins/<pk>/` |
| Delete account | `DELETE /api/users/admins/<pk>/` (full-control) |
| Approve pending request | `POST /api/users/admins/<pk>/approve/` |
| Reject pending request | `POST /api/users/admins/<pk>/reject/` |
| Assign role / position | `PATCH /api/users/admins/<pk>/assign-role/` (full-control) |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/users/admins/` | List accounts |
| `GET /api/users/admins/pending/` | Pending access requests |
| `POST /api/users/admins/<pk>/approve/` | Approve request |

## Notes

- Uses `OfficersProvider` — roster updates broadcast live over WebSocket.
- Backend stores officer accounts with `role='ADMIN'`; the UI presents them as officers.
- Deleting/updating an admin or assigning roles triggers a WebSocket `officers.roster.updated` broadcast.

## Preview

![Admin officers preview](/images/admin-officers.svg)

## Related Pages

- [Screen: Admin Officers Accounts](/screens/admin-officers-accounts)
- [Flow: Admin Access Request](/flows/admin-access-request)
- [Flow: Realtime WebSockets](/flows/realtime-websockets)
- [Admin Guide: Officers](/admin-guide/officers)
