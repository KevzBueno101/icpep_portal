---
title: Audit Logs
description: System activity monitoring and CSV export
---

# Audit Logs

The audit log records all significant actions taken within the system for accountability and troubleshooting.

> ![Audit logs screenshot](../images/admin-audit-logs.svg)

## Logged Actions

| Action Type | Examples |
|---|---|
| **CREATE** | Member registered, announcement created, admin created |
| **UPDATE** | Profile edited, member approved, announcement modified |
| **DELETE** | Member deleted, announcement removed, admin removed |
| **LOGIN** | Admin or member logged in |
| **APPROVE** | Membership approved |
| **REJECT** | Membership rejected |
| **RENEW** | Membership renewed |
| **DELEGATE** | Secretary delegation toggled |

## Log Details

Each log entry contains:

| Field | Description |
|---|---|
| **Timestamp** | When the action occurred |
| **Admin/User** | Who performed the action |
| **Action** | The action type |
| **Entity** | What was affected (Member, Announcement, etc.) |
| **Details** | Additional context (e.g., "Approved member John Doe") |

## Filtering

Filters available:

- **Action Type** â€” dropdown to select specific action types
- **Entity Type** â€” filter by affected entity
- **Date Range** â€” specify start and end dates
- **Admin** â€” filter by specific admin

## CSV Export

Click **Export CSV** to download the current filtered view as a CSV file. This is useful for:

- External reporting
- Offline record-keeping
- Compliance documentation

## Retention

> Audit logs are retained indefinitely. Contact the system administrator if log pruning is needed.
