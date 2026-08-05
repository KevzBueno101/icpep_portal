---
title: Screen — Login
description: Member login page walkthrough
---

# Login (`/login`)

## File

`frontend/src/pages/auth/Login.jsx`

## What it shows

Member login form (email + password) with a link to registration and a **Forgot password** link. Also handles the post-login routing based on role and membership status.

## How to move around

| Action | Result |
|---|---|
| Enter email + password → **Log in** | `POST /api/auth/login/` |
| ADMIN user logs in here | Rejected — must use the admin portal |
| APPROVED member | Redirects to `/member/dashboard` |
| PENDING/REJECTED member | Redirects to `/membership-pending` |
| Click **Forgot password** | Goes to `/forgot-password` |

## Failed attempts

- Before login, the page calls `GET /api/auth/failed-attempts/`.
- After **5 failures in 15 minutes**, shows a "too many attempts" toast (HTTP 429).

## Key API calls

| Endpoint | Use |
|---|---|
| `POST /api/auth/login/` | Obtain JWT tokens |
| `GET /api/auth/failed-attempts/` | Pre-check block state |

## Notes

- Uses `publicApi` (no auth interceptor) — login itself is unauthenticated.
- On success, tokens are stored under the **member** keys and `GET /api/auth/me/` resolves the role/status.

## Related Pages

- [Screen: Admin Login](/screens/admin-login)
- [Flow: Auth & Sessions](/flows/auth-session)
- [Flow: Password Reset](/flows/password-reset)
