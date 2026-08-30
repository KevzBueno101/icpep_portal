---
title: Deployment
description: How the ICPEP Portal is deployed to Vercel and Render, including the CI/CD pipeline and boot sequence
---

# Deployment

The portal is split across two hosts with automated CI/CD via GitHub Actions.

```
┌──────────────┐      git push      ┌──────────────────┐
│  GitHub repo │ ─────────────────► │  GitHub Actions   │
│  (dev/main)  │                    │  ci-cd.yml        │
└──────────────┘                    └─────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    ▼                        ▼                        ▼
            ┌──────────────┐        ┌──────────────┐         ┌───────────────┐
            │   Vercel     │        │    Render    │         │  GitHub Pages  │
            │  Frontend    │        │   Backend    │         │ (not used)     │
            │  /api calls  │───────►│  daphne/ASGI │         └───────────────┘
            └──────────────┘        └──────┬───────┘
                                           ▼
                                     PostgreSQL
```

## Frontend — Vercel

- Project: `icpep-catsu.vercel.app` (production).
- Auto-deploys from the **`dev`** branch (this is important — Vercel is wired to `dev`, so all frontend work lands here).
- Build command: `npm run build` (in `frontend/`), which runs Vite + the PWA service-worker build.
- Env (`frontend/.env.production`):

  | Variable | Value |
  |---|---|
  | `VITE_API_URL` | `https://icpep-portal-backend.onrender.com/api` |
  | `VITE_BACKEND_URL` | `https://icpep-portal-backend.onrender.com` |
  | `VITE_WS_URL` | `wss://icpep-portal-backend.onrender.com` |

## Backend — Render

- Service: `icpep-portal-backend.onrender.com`.
- **Branch is critical**: Render must be pointed at **`dev`** — the `main` branch historically predates several features (including the push app). If `vapid-key` returns `404`, the deployed code is from `main`.
- Web process: `web: bash start.sh` (see [Boot sequence](#boot-sequence)).
- Production database: Render-managed PostgreSQL (`DATABASE_URL`).

### Boot sequence (`backend/start.sh`)

1. Step-logged echo of each phase.
2. `python manage.py migrate --noinput` — applies pending migrations at every boot (idempotent).
3. `python manage.py create_superadmin` — idempotent; creates the superadmin from `DJANGO_SUPERADMIN_EMAIL/USERNAME/PASSWORD` env if set.
4. `exec daphne -b 0.0.0.0 -p ${PORT:-8000} config.asgi:application` — serves HTTP + WebSockets (ASGI).

> **Note:** Render free tier spins down after inactivity; the first request after idle triggers a cold start that can take ~30–60s (including `migrate`). Push notifications may be delayed by this cold start.

### Render environment

Must include the full env contract — see [Environment Variables](/environment-variables). Minimum for a healthy boot:

- `SECRET_KEY`, `DEBUG=False`, `ALLOWED_HOSTS`
- `DATABASE_URL` (Render Postgres)
- `CORS_ALLOWED_ORIGINS`, `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
- `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (missing → `vapid-key` returns `503` and no push is sent)
- `SENDGRID_API_KEY` (password-reset email)
- Optional: `REDIS_URL`, `SUPABASE_URL`/`SUPABASE_KEY` (unused), `DJANGO_SUPERADMIN_*`

## CI/CD — GitHub Actions (`.github/workflows/ci-cd.yml`)

| Job | Triggers | Steps |
|---|---|---|
| `frontend` | push to `dev`/`main`, PR to `main` | `npm ci` → `npm run lint` → `npm run test` → `npm run build` (Node 20) |
| `backend` | same | `pip install` → `ruff check .` → `python manage.py test` against a PostgreSQL 18 service container (Python 3.12) |
| `deploy` | **push to `main` only**, after lint/test | POSTs `VERCEL_DEPLOY_HOOK` and `RENDER_DEPLOY_HOOK` secrets |

> **Workflow reality check:** Vercel auto-deploys from `dev`, so frontend changes ship on every `dev` push. The `deploy` job only runs on `main` pushes (which the team rarely makes). Do not rely on the deploy job for day-to-day publishing.

## Management Commands

| Command | Purpose |
|---|---|
| `python manage.py create_superadmin` | Create the bootstrap admin from env (idempotent) |
| `python manage.py reset_admin_password` | Reset an admin password from env |
| `python manage.py backfill_transactions` | Create `PaymentTransaction` rows for existing members (`--dry-run` supported) |
| `python manage.py debug_admin_profile` | Inspect an admin account |

## Related Pages

- [System Architecture](/architecture)
- [Environment Variables](/environment-variables)
- [Troubleshooting](/troubleshooting)
- [Maintenance & Handover](/maintenance-handover)
