---
title: Glossary
description: Domain terms, roles, and status enums used throughout the ICPEP Portal
---

# Glossary

## Roles & Accounts

| Term | Meaning |
|---|---|
| **MEMBER** | A registered student member. Stored with `role='MEMBER'` (string) even though it is not a declared `User` choice. |
| **OFFICER** | A chapter officer holding an admin-capable account (stored as `role='ADMIN'` with a `position`). |
| **ADMIN** | Full system access. The President always has `FULL_CONTROL`. |
| **PRESIDENT** | Highest role; always `FULL_CONTROL` regardless of `access_level`; sole owner of year-end reset and direct officer creation. |
| **access_level** | `FULL_CONTROL` / `MEMBERSHIP` / `RESTRICTED` — gates what an admin can do. |
| **position** | Free-text office title ("President", "Treasurer", …). `'NONE'` = no active term. |
| **officer_id** | Auto-generated ID (`ICPEP-0001`…) shown on officer cards. |

## Membership & Payments

| Term | Meaning |
|---|---|
| **PENDING** | Application submitted, awaiting admin approval. |
| **APPROVED** | Active member. |
| **REJECTED** | Application refused; member can renew. |
| **EXPIRED** | Membership lapsed (e.g., via year-end reset); member must renew. |
| **REGISTRATION / RENEWAL** | Payment transaction types. |
| **ON_HAND / GCASH** | Payment methods. |
| **VERIFIED / PENDING** | Transaction statuses. A verified transaction has an e-receipt. |
| **E-Receipt** | Auto-generated PNG acknowledgment receipt (`ICPEP-YYYY-NNNN` reference). |
| **payment settings** | The chapter's GCash number + name shown to members during payment. |

## Content

| Term | Meaning |
|---|---|
| **Announcement** | A published notice. Categories: announcement / achievement / update / opportunity / event. |
| **Milestone** | A chapter history item on the public timeline. Categories: founding / achievement / recognition / event / community / feature. |
| **pinned** | Announcement pinned to the top of the feed. |
| **is_published** | Whether an announcement is visible publicly. |
| **members_only** | Announcement hidden from the public feed; only members see it (via `include_members_only=1`). |

## System

| Term | Meaning |
|---|---|
| **JWT** | JSON Web Token. Access (15 min) + refresh (7 days), rotated + blacklisted. |
| **VAPID** | Voluntary Application Server Identification — key pair used for Web Push. |
| **aes128gcm** | Push message content-encoding used by `pywebpush`. |
| **Push subscription** | A saved browser push subscription per device (`endpoint`, `p256dh`, `auth`). |
| **Audit log** | Immutable record of privileged actions, retained 90 days. |
| **WebSocket / Channels** | Realtime channel (Daphne) used to broadcast roster updates to open tabs. |
| **`log_action()`** | Backend helper that writes an `AuditLog` row (never raises). |
| **`create_superadmin`** | Idempotent management command that bootstraps the admin from env. |

## Frontend

| Term | Meaning |
|---|---|
| **`api`** | Authenticated axios instance (JWT interceptor). |
| **`publicApi`** | Unauthenticated axios instance (login, public reads, VAPID key). |
| **`ProtectedRoute` / `AdminProtectedRoute`** | Route guards for member and admin areas. |
| **5-tap gesture** | Hidden 5-tap-on-logo (within 2.5s) entry to the admin portal login. |
| **SW (service worker)** | `frontend/src/sw.js` — precache, SPA fallback, push + notification click handling. |

## Related Pages

- [Data Model](/data-model) — field-level reference
- [Security](/security) — auth/roles deep dive
- [Screens](/screens/landing) — page-by-page walkthroughs
