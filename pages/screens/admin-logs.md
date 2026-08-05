---
title: Screen — Admin Logs
description: Audit log viewer with filters, CSV export, and unread badge
---

# Admin Logs (`/admin/logs`)

## File

`frontend/src/pages/admin/placeholder/AdminLogs.jsx`

## What it shows

The audit-trail viewer:

- **Action-type filter** — `MEMBER_APPROVED/REJECTED/CREATED/UPDATED/DELETED`, `ROLE_ASSIGNED`, `ADMIN_CREATED/UPDATED/DELETED`, `MILESTONE_*`, `ANNOUNCEMENT_*`, `YEAR_END_RESET`, `PAYMENT_SETTINGS_UPDATED`
- **Entity-type filter** — `Member`, `User`, `Milestone`, `Announcement`, `PaymentSettings`
- Log rows: timestamp, actor, action, entity, details, IP
- Sidebar **unread badge** based on `GET /api/audit-logs/stats/?last_visit=` vs `lastLogsVisit` in localStorage

## How to move around

| Action | Result |
|---|---|
| Filter by action/entity | Refreshes the list |
| Export | `GET /api/audit-logs/export/` → `audit_logs.csv` |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/audit-logs/` | List + filter |
| `GET /api/audit-logs/export/` | CSV download |
| `GET /api/audit-logs/stats/` | Unread badge count |

## Notes

- Logs are written by `log_action()` on every privileged mutation (see [Audit Logging flow](/flows/audit-logging)).
- Old logs are purged after 90 days via `POST /api/audit-logs/cleanup/`.

## Preview

![Admin audit logs preview](/images/admin-audit-logs.svg)

## Related Pages

- [Flow: Audit Logging](/flows/audit-logging)
- [Admin Guide: Audit Logs](/admin-guide/audit-logs)
- [Data Model: AuditLog](/data-model)
