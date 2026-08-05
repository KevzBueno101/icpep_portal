---
title: Screen — Admin Login & Access Request
description: Hidden admin portal login and the officer access-request form
---

# Admin Login (`/admin-portal/login`)

## File

`frontend/src/pages/auth/AdminLogin.jsx`

## How to reach it

It is **not linked from anywhere**. The only entry is the **hidden 5-tap gesture**: on the landing page, tap the center ICpEP.SE logo **5 times within 2.5 seconds** (`utils/logoSecretTaps.js`), which navigates to `/admin-portal/login`.

## What it shows

Two views:

1. **Login** — admin email + password → `POST /api/auth/admin-login/`
2. **Request access** (toggle) — for officers who need admin access:
   - email, username, password, confirm password, first/last name
   - requested position, department, academic year
   - admin note + profile picture

## How to move around

| Action | Result |
|---|---|
| Log in (valid, APPROVED, active, term active) | Redirects to `/admin/dashboard` |
| Log in (PENDING / REJECTED / term ended / disabled) | Distinct error message (see [Auth flow](/flows/auth-session)) |
| Switch to **Request access** | Fills the access-request form → `POST /api/auth/admin-register/` |
| Submit request | "Wait for President approval" (no tokens issued) |

## Key API calls

| Endpoint | Use |
|---|---|
| `POST /api/auth/admin-login/` | Admin JWT login |
| `POST /api/auth/admin-register/` | Officer access request |

## Notes

- Rate limited (5/15 min) with a manual 429 plus per-email failure block.
- Admin tokens are stored under the **admin** keys so they never collide with member sessions.

## Related Pages

- [Flow: Admin Access Request](/flows/admin-access-request)
- [Flow: Auth & Sessions](/flows/auth-session)
- [Screen: Login](/screens/login)
