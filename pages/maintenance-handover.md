---
title: Maintenance & Handover
description: Checklist for the next generation of ICPEP Portal maintainers — from onboarding to the year-end transition
---

# Maintenance & Handover

This guide is written for the **next generation** who will take over the ICPEP Portal. Follow it in order: first time, then every regular maintenance cycle.

## 1. First-time onboarding checklist

- [ ] Add the repo owners as maintainers on GitHub (repo: `KevzBueno101/icpep_portal`).
- [ ] Grant access to **Vercel** (frontend) and **Render** (backend + PostgreSQL) dashboards.
- [ ] Get a copy of `backend/.env` (production keys live in Render env; the local copy holds the same VAPID keys).
- [ ] Confirm **Render backend is on the `dev` branch** (not `main`).
- [ ] Confirm **VAPID keys** are set in Render env (else push returns 503).
- [ ] Read the key docs:
  - [System Architecture](/architecture)
  - [Technology Stack](/technology-stack)
  - [Data Model](/data-model)
  - [Deployment](/deployment)
  - [Environment Variables](/environment-variables)
- [ ] Set up local dev (see [Setup](/setup)) and confirm the app runs.

## 2. Regular maintenance

### Every login / role change
- Uses the [Admin Access Request flow](/flows/admin-access-request) — President approves; assign access levels and positions via `/admin/admins`.

### GCash settings
- Update the chapter's GCash number/name on the Admin Dashboard (President/Treasurer). Members see it during payment.

### Announcements
- Create (not re-publish) to trigger push notifications. Members-only = hidden from public feed.

### Audit logs
- Old logs purge automatically after 90 days. Export a CSV first if you need a permanent record (`/admin/logs` → export).

### Dependencies
- Backend: `pip install -r requirements.txt` (keep pinned versions; `pywebpush` is a deliberate addition).
- Frontend: `npm install` in `frontend/`; keep ESLint at 0 errors and Ruff at 0.
- Run `cd frontend && npm run test` and `cd backend && python manage.py test` before pushing.

## 3. Year-end transition (once per academic year)

1. Announce the transition to members.
2. (Optional) Export the audit log CSV for the year's records.
3. Run the [Year-End Reset](/flows/year-end-reset):
   - **President** executes `POST /api/users/admins/year-end-reset/` (expires all members + clears non-President officer terms).
   - This forces every member to [renew](/flows/member-renewal) and pay again.
4. Set the **GCash settings** for the new academic year if they changed.
5. Re-appoint the new set of officers via role assignment / access requests.
6. Verify a test member can register → approve → receive an e-receipt → see the push notification.

> ⚠️ The year-end reset is **destructive and irreversible**. Confirm with the outgoing President first.

## 4. VAPID keys (push notifications)

- The key pair lives in `backend/.env` and must be mirrored exactly in **Render → Settings → Environment** (`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_CLAIMS_EMAIL`).
- If you ever lose the private key, **every subscribed device must resubscribe** (regenerate keys, update both `.env` and Render, and have members toggle notifications off/on).

## 5. Restoring / backups

- The **PostgreSQL database on Render** is the source of truth. Enable automated backups in Render's PostgreSQL settings, or run periodic `pg_dump`.
- Media (images, receipts, proofs) lives on **Cloudinary** — its cloud holds the originals.
- `PaymentTransaction` rows can be re-created from member history with `python manage.py backfill_transactions` (use `--dry-run` first).

## 6. When in doubt

- Check [Troubleshooting](/troubleshooting) first.
- The docs mirror the code 1:1 — every endpoint and model is documented under [Technical Reference](/technology-stack) and [Flows](/flows/member-registration).
- Contact the org email (`icpep.se.catsuchapter@gmail.com`) for access to the external dashboards.

## Related Pages

- [Deployment](/deployment)
- [Environment Variables](/environment-variables)
- [Troubleshooting](/troubleshooting)
- [Flow: Year-End Reset](/flows/year-end-reset)
