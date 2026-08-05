---
title: Environment Variables
description: Complete environment variable contract for the ICPEP Portal backend and frontend
---

# Environment Variables

This is the authoritative list of every environment variable the system reads. The backend source of truth is `backend/.env.template`; the frontend uses `frontend/.env` / `frontend/.env.production`.

## Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DEBUG` | dev | `True` for local dev; `False` in production |
| `SECRET_KEY` | ✅ prod | Django secret key |
| `ALLOWED_HOSTS` | prod | Comma-separated hostnames (e.g. `icpep-portal-backend.onrender.com`) |
| `DATABASE_URL` | ✅ prod | PostgreSQL connection string |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_SSLMODE` | alt | Individual DB vars (used by CI/tests instead of `DATABASE_URL`) |
| `CORS_ALLOWED_ORIGINS` | ✅ prod | Comma-separated frontend origins (Vercel) |
| `FRONTEND_URL` | ✅ prod | Frontend base URL (used for CORS + push click + reset email links) |
| `CLOUDINARY_CLOUD_NAME` | media | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | media | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | media | Cloudinary API secret |
| `VAPID_PUBLIC_KEY` | push | Web Push VAPID public key (base64url) |
| `VAPID_PRIVATE_KEY` | push | Web Push VAPID private key (base64url) |
| `VAPID_CLAIMS_EMAIL` | push | `sub` claim for push (`icpep.se.catsuchapter@gmail.com`) |
| `SENDGRID_API_KEY` | email | SendGrid key for password-reset email |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | alt | SMTP fallback when SendGrid not set |
| `REDIS_URL` | optional | For production Channels layer (currently unused — InMemory in dev) |
| `SUPABASE_URL`, `SUPABASE_KEY` | optional | Unused dependency (dead code) |
| `DJANGO_SUPERADMIN_EMAIL`, `DJANGO_SUPERADMIN_USERNAME`, `DJANGO_SUPERADMIN_PASSWORD` | optional | Bootstraps superadmin via `create_superadmin` |

### Critical pairs (easy to miss)

| Missing config | Symptom |
|---|---|
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | `GET /api/push/vapid-key/` → **503**; no push notifications sent |
| `CLOUDINARY_*` | Image/uploads fall back to local media; broken image URLs in production |
| `SENDGRID_API_KEY` | Password reset falls back to SMTP (may fail if SMTP also unset) |
| `SECRET_KEY` / `DEBUG=True` in prod | Insecure; tokens re-issue on every env change (old tokens → 401) |

## Frontend (`frontend/.env.production`)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://icpep-portal-backend.onrender.com/api` |
| `VITE_BACKEND_URL` | `https://icpep-portal-backend.onrender.com` |
| `VITE_WS_URL` | `wss://icpep-portal-backend.onrender.com` |

Local dev (`frontend/.env` or default): `VITE_API_URL` falls back to `http://127.0.0.1:8000/api`.

## CI (`.github/workflows/ci-cd.yml`)

Backend test job sets: `DEBUG=False`, a throwaway `SECRET_KEY`, `DB_NAME/USER/PASSWORD/HOST/PORT/SSLMODE` for the PostgreSQL service container, `CORS_ALLOWED_ORIGINS=''`, and `SUPABASE_URL/KEY=''`.

## Related Pages

- [Deployment](/deployment)
- [Technology Stack](/technology-stack)
- [Troubleshooting](/troubleshooting)
