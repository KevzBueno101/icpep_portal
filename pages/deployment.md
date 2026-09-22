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

There are **two Vercel projects**:

| Project | Branch | Domain |
|---|---|---|
| Production | `main` | `icpepcatsu.app` |
| Dev/Test | `dev` | `icpep-catsu.vercel.app` |

- Build command: `npm run build` (in `frontend/`), which runs Vite + the PWA service-worker build.
- The committed `frontend/.env.production` is the **production default** (`icpep-api-main`). Both projects carry dashboard `VITE_*` overrides; the **dev project's dashboard override points to `icpep-api`** so dev/test stays on the dev backend and database.

## Cloudflare Workers — API proxy

The browser can't reach `*.onrender.com` (PLDT/ISP TCP-443 block), so a **Cloudflare Worker** reverse-proxies the backend. One source file (`workers/api-proxy.js`) picks the backend from the worker's own hostname:

| Worker | Origin (Render) |
|---|---|
| `icpep-api.icpep-se-catsuchapter.workers.dev` | `https://icpep-backend-mriy.onrender.com` (dev/test, DB = dev) |
| `icpep-api-main.icpep-se-catsuchapter.workers.dev` | `https://icpep-portal-backend.onrender.com` (main/prod, DB = prod) |

Deployed by pasting `workers/api-proxy.js` into each worker (dashboard). The worker rewrites `Host` to the backend origin and sets `X-Forwarded-Proto/For/Host` (backend keeps `ALLOWED_HOSTS` untouched).

Frontend env (committed `frontend/.env.production` = production):

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://icpep-api-main.icpep-se-catsuchapter.workers.dev/api` |
| `VITE_BACKEND_URL` | `https://icpep-api-main.icpep-se-catsuchapter.workers.dev` |
| `VITE_WS_URL` | `wss://icpep-portal-backend.onrender.com` |

Dev/test dashboard override replaces these with the `icpep-api` worker (`VITE_WS_URL` → `wss://icpep-backend-mriy.onrender.com`).

## Backend — Render (two services)

| Service | Branch | Purpose |
|---|---|---|
| `icpep-portal-backend.onrender.com` | **`main`** | Production (prod DB) |
| `icpep-backend-mriy.onrender.com` | **`dev`** | Dev/Test (dev DB) |

- **Branch is critical**: `icpep-portal-backend` must point at `main`, `icpep-backend-mriy` at `dev`. If `vapid-key` returns `404`, the deployed code predates the push app.
- Web process: `web: bash start.sh` (see [Boot sequence](#boot-sequence)).
- Each service has its own Render-managed PostgreSQL (`DATABASE_URL`).

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

### Deploy hook secrets

The `deploy` job POSTs to deploy hooks guarded by GitHub Actions secrets. If a secret is missing, the step **skips with a warning** instead of failing the run — so configure the hooks for deploys to actually fire:

| Secret | Where to create the hook | Add it at |
|---|---|---|
| `VERCEL_DEPLOY_HOOK` | Vercel → project → **Settings → Deploy Hooks** → create hook (copy URL) | `https://github.com/KevzBueno101/icpep_portal/settings/secrets/actions` |
| `RENDER_DEPLOY_HOOK` | Render → service → **Settings → Deploy Hooks** → create hook (copy URL) | same |

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
