---
title: Technology Stack
description: Full technology stack used by the ICPEP Portal across frontend, backend, database, storage, and deployment
---

# Technology Stack

This page lists every technology and library used by the ICPEP Portal. It is the authoritative reference for the "next generation" maintainers — when in doubt about whether a tool is part of the system, check here.

## Frontend

Hosted on **Vercel**, built with **Vite 8**.

| Purpose | Technology | Version | Notes |
|---|---|---|---|
| UI framework | React + React DOM | 19.2 | Function components + hooks throughout |
| Build tool / dev server | Vite | 8.0 | ESM, fast HMR |
| Styling | Tailwind CSS | 3.4 | Utility classes; `frontend/index.css` |
| Routing | React Router DOM | 7.15 | `BrowserRouter` in `App.jsx` |
| State management | Zustand | 5.0 | Global client state |
| HTTP client | Axios | 1.16 | `src/api/axios.js` — `api` (authed) + `publicApi` (no auth) |
| Toasts | React Hot Toast | 2.6 | Dark theme, top-right |
| Icons | lucide-react | 1.17 | Consistent icon set |
| Charts | Recharts | 3.8 | Admin dashboard growth + status charts |
| QR codes | qrcode + qrcode.react | 1.5 / 4.2 | ID card + officer card QR |
| Image export | html2canvas | 1.4 | Member ID card PNG download |
| Drag & drop reorder | @dnd-kit (core, sortable, utilities) | 6.3 / 10 / 3.2 | Milestones, announcements, officer ordering |
| PWA | vite-plugin-pwa | 1.3 | `injectManifest` strategy, service worker, install prompt |
| Testing | Vitest + Testing Library + happy-dom + jsdom | 4 / 16 / 20 / 29 | `frontend/test/` |
| Linting | ESLint 10 + react-hooks + react-refresh | 10.3 | `npm run lint` (0 errors required) |

## Backend

Hosted on **Render**, served by **Daphne** (ASGI). Python **3.12** (`.python-version` = 3.12.4, `runtime.txt` = 3.12.9).

| Purpose | Technology | Version | Notes |
|---|---|---|---|
| Web framework | Django | 5.2.15 | Project package is `config` |
| API framework | Django REST Framework | 3.17.1 | All JSON APIs |
| ASGI server | Daphne | 4.2.2 | `config.asgi:application` |
| Real-time / WebSockets | Channels | 4.3.2 | Officers roster broadcast |
| Channel layer | channels_redis + redis | 4.3 / 8.0 | Installed; dev uses `InMemoryChannelLayer` |
| JWT auth | DRF SimpleJWT | 5.5.1 | Access 15m / refresh 7d, rotation + blacklist |
| CORS | django-cors-headers | 4.9.0 | Allow-listed origins |
| Content Security Policy | django-csp | 4.0 | Strict directives in settings |
| Rate limiting | django-ratelimit | 4.1.0 | All auth endpoints |
| Media storage | Cloudinary + django-cloudinary-storage | 1.44 / 0.3 | Images, proofs, receipts |
| Database driver | psycopg2-binary | 2.9.12 | PostgreSQL |
| Image / receipt rendering | Pillow | 12.2 | E-receipt PNG generator |
| Web Push | pywebpush | 2.3.0 | VAPID, `aes128gcm` encoding |
| Email | SendGrid | 6.10 | Password reset emails |
| Static files | Whitenoise | 6.12.0 | Production static serving |
| Async HTTP | httpx | 0.28 | Channel layer / service use |
| Env config | python-dotenv | 1.2 | Reads `.env` |
| Linting | Ruff | 0.11+ | `ruff check .` (0 errors required) |

> **Unused dependency:** Supabase packages (`supabase`, `postgrest`, `storage3`, `realtime`, `supabase-auth`, `supabase-functions`) are pinned in `requirements.txt` and `SUPABASE_URL`/`SUPABASE_KEY` exist in CI, but nothing in the project imports them (`backend/utils/supabase_client.py` is dead code). They can be removed without breaking anything.

## Database & Storage

| Resource | Provider | Purpose |
|---|---|---|
| PostgreSQL | Render (managed) | Primary database; connection via `DATABASE_URL` env |
| Cloudinary | Cloudinary | All uploaded media: member photos, COE/ID docs, payment proofs, receipts, announcement/milestone images |
| Redis | (optional) | Available for production Channels layer; not currently wired |

## Deployment & DevOps

| Tool | Role |
|---|---|
| Vercel | Frontend hosting + auto-deploy from `dev` |
| Render | Backend hosting; `web: bash start.sh` → migrate + daphne |
| GitHub Actions | `ci-cd.yml`: frontend lint/test/build, backend ruff + Django tests, deploy hooks on `main` push |
| Git / GitHub | Version control; default branch `main`, active branch `dev` |
| Mintlify | This documentation site (`docs.json` + `pages/`) |

## Auth & Security

| Technology | Role |
|---|---|
| JWT (SimpleJWT) | Stateless auth; access (15 min) + refresh (7 days) |
| django-ratelimit | Per-IP throttling + per-email failed-login block (5 attempts / 15 min) |
| django-csp / django-cors-headers | Browser security + cross-origin policy |
| PBKDF2 (Django default) | Password hashing (MD5 in tests only) |

## PWA & Realtime

- **Service Worker** (`frontend/src/sw.js`) — injectManifest strategy; precache, SPA fallback, `StaleWhileRevalidate` for `/api/`, CacheFirst for images/fonts, push + notification-click handlers.
- **Web Push** — VAPID keys from env (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`), payload encrypted with `aes128gcm`, 410-response subscription pruning.
- **WebSockets** — `/ws/officers/` → `OfficersConsumer`, broadcasts `officers.roster.updated` to all connected tabs.

## Related Pages

- [System Architecture](/architecture)
- [Data Model](/data-model)
- [Data Flow Diagram](/data-flow-diagram)
- [Environment Variables](/environment-variables)
- [Deployment](/deployment)
