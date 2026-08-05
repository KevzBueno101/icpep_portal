---
title: Screen — Admin Dashboard
description: Admin analytics, role management, GCash settings, and officer creation
---

# Admin Dashboard (`/admin/dashboard`)

## File

`frontend/src/pages/admin/AdminDashboard.jsx`

## What it shows

- **Stat cards** — admins, pending / approved / rejected / expired / total members, your role
- **Charts** (Recharts) — membership growth line chart + membership status pie chart
- **GCash settings** editor (President/Treasurer or full-control)
- **Role / position assignment** controls
- **Create officer account** (President only)

## How to move around

| Action | Result |
|---|---|
| Manage members | Links to `/admin/membership` |
| Verify a pending member | Opens `/admin/membership/:id/verify` |
| Edit GCash settings | `PATCH /api/members/payment-settings/` |
| Assign role / position | `POST /api/users/admins/<id>/assign-role/` |
| Create officer | `POST /api/users/admins/create/` (President only) |
| Approve/reject member | `POST /api/members/<id>/approve/` |

## Permission gating

| Capability | Who |
|---|---|
| `canManageRoles` | GCash settings + role/position + officer creation |
| `canApproveMembers` | PRESIDENT / SECRETARY |
| President-only positions | `PRESIDENT`, `TREASURER`, `SECRETARY`, `NONE` |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/audit-logs/stats/` (via sidebar) | Unread logs badge |
| `GET /api/members/` | Member counts |
| `PATCH /api/members/payment-settings/` | GCash settings |
| `POST /api/users/admins/create/` | Officer creation |

## Notes

- Dispatches window events (`officers-refresh`, `member-list-updated`, `payment-settings-updated`) so all open pages update.
- Uses `OfficersProvider` for the leadership carousel.

## Preview

![Admin dashboard preview](/images/admin-dashboard.svg)

## Related Pages

- [Screen: Admin Membership](/screens/admin-membership)
- [Screen: Admin Admins](/screens/admin-admins)
- [Flow: Payments & E-Receipts](/flows/payments-receipts)
- [Admin Guide: Dashboard](/admin-guide/dashboard)
