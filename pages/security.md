---
title: Security
description: Authentication, authorization, rate limiting, and browser security configuration of the ICPEP Portal
---

# Security Model

## Authentication (JWT)

The backend uses **DRF SimpleJWT** with these settings (`backend/config/settings.py`):

| Setting | Value |
|---|---|
| Access token lifetime | 15 minutes |
| Refresh token lifetime | 7 days |
| `ROTATE_REFRESH_TOKENS` | `True` |
| `BLACKLIST_AFTER_ROTATION` | `True` |
| `UPDATE_LAST_LOGIN` | `True` |
| Signing | HS256, `Bearer` scheme |
| Backend | `authentication.backends.EmailBackend` (case-insensitive email lookup) |

### Token flow

1. Login (`/api/auth/login/` or `/api/auth/admin-login/`) returns **access** + **refresh** tokens.
2. The frontend stores them in `localStorage` under separate keys for **member** and **admin** sessions (`member_access_token` / `member_refresh_token` vs `admin_access_token` / `admin_refresh_token`).
3. Every authed request sends `Authorization: Bearer <access>`.
4. On a `401`, the axios interceptor refreshes the correct session's token and retries once. If refresh fails (or no refresh token exists), tokens are cleared and the user is redirected to the role-appropriate login.
5. Logout and password changes blacklist outstanding refresh tokens.

### Dual-session separation

Admin and member tokens never overwrite each other (separate storage keys). The interceptor picks the session type by comparing the request's bearer token with the stored member access token.

## Authorization Model

### Roles

```
ADMIN → OFFICER → MEMBER
```

- **ADMIN** — full system access, manages other admins
- **OFFICER** — administrative access with an assigned position (stored in `users.User` with `role='ADMIN'`)
- **MEMBER** — can view profile, renew, see announcements

### Permission matrix

| Access Level | Members CRUD | Announcements CRUD | Achievements CRUD | Admins CRUD | Own Profile |
|---|---|---|---|---|---|
| **FULL_CONTROL** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **MEMBERSHIP** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **RESTRICTED** | ❌ | ❌ | ❌ | ❌ | ✅ |

> **President** always has `FULL_CONTROL` regardless of its `access_level` field.

### Position-based capabilities (`users.User` properties)

| Capability | Positions |
|---|---|
| `has_payment_access` | President, Finance, Treasurer |
| `has_approval_access` | President, Vice President, Secretary |
| `can_manage_roles` | President (always), ADMIN + FULL_CONTROL |
| `can_add_announcements` | President + `FULL_CONTROL` |

## Rate Limiting

`django-ratelimit` is applied on every auth endpoint (per-IP):

| Endpoint | Limit |
|---|---|
| `/api/auth/register/`, `/admin-register/`, `/availability/`, `/me/`, `/change-password/`, `/forgot-password/`, `/reset-password/` | 5 / minute |
| `/api/auth/admin-login/` | 5 / 15 min |
| `/api/auth/failed-attempts/` | 10 / minute |

In addition, the app tracks **failed login attempts per email**: after **5 failures within 15 minutes**, the account is blocked for 15 minutes (HTTP 429). `FailedLoginAttempt` rows back this check.

## Browser Security

- **CORS** (`django-cors-headers`): `CORS_ALLOW_ALL_ORIGINS=False`; allowed origins come from the `CORS_ALLOWED_ORIGINS` env (defaults to localhost regexes for dev). `CORS_ALLOW_CREDENTIALS=False`.
- **CSP** (`django-csp`): strict directives — `default-src 'self'`, `script-src 'self'`, `style-src 'self' 'unsafe-inline'`, explicit `img-src`/`connect-src` allowing the backend, Render, Cloudinary, and the frontend origin + `wss://`.
- `SECURE_BROWSER_XSS_FILTER` / `SECURE_CONTENT_TYPE_NOSNIFF` / `X_FRAME_OPTIONS='DENY'`.
- Production adds HSTS + secure cookies; SSL redirect is left to the Render proxy.

## Upload Validation

- `payment_proof_image` — real image ≤ 10 MB (validated via `imghdr`).
- `coe_id_image` — JPG / PNG / PDF ≤ 10 MB.
- `profile_picture` — ≤ 10 MB.
- Images are stored on **Cloudinary** (or local media when Cloudinary is not configured).

## Password Reset

1. `POST /api/auth/forgot-password/` creates a `PasswordResetToken` (`secrets.token_urlsafe(48)`) and emails `<FRONTEND_URL>/reset-password/<uidb64>/<token>` via **SendGrid** (background thread).
2. `POST /api/auth/reset-password/` validates uidb64/token/usage/expiry (24 h), runs Django password validators, then **blacklists all outstanding refresh tokens** for that user.
3. `POST /api/auth/change-password/` (authenticated) also blacklists refresh tokens.

## Audit Trail

Every privileged mutation calls `audit_logs.utils.log_action()` (never raises, errors logged). See [Audit Logging flow](/flows/audit-logging). Logs are retained **90 days** (`AUDIT_LOG_RETENTION_DAYS`) and can be cleaned up via `POST /api/audit-logs/cleanup/`.

## Related Pages

- [System Architecture](/architecture)
- [Auth & Session Flow](/flows/auth-session)
- [Password Reset Flow](/flows/password-reset)
- [Environment Variables](/environment-variables)
