---
title: Troubleshooting
description: Common issues and how to resolve them for the ICPEP Portal
---

# Troubleshooting

This page collects the issues that recur most often, with the fix for each. Start here before digging into the code.

## Frontend

### "Request failed with status code 401" when using the app

**Cause:** The session is stale — the access token expired and the refresh token is missing/expired.

**Fix:**
- The axios interceptor now redirects to the role-appropriate login when refresh fails. Just log in again.
- If it happens repeatedly, clear the site's `localStorage` and hard-reload.

### Toast "Push notifications are not available on the server right now"

**Cause:** `GET /api/push/vapid-key/` returned 404 or 503.

**Fix:** On Render, confirm (1) the service is on the **`dev`** branch and (2) `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` are set in the environment. 404 = wrong branch; 503 = missing VAPID keys.

### Notifications arrive but show Chrome's default "Tap to copy URL"

**Cause:** Stale service worker, or legacy `aesgcm` content encoding.

**Fix:**
1. Hard-reload the PWA twice (or clear site data) so the new `sw.js` activates.
2. In `chrome://serviceworker-internals/`, tap **Push** and inspect the payload — if it says "New announcement", the backend is sending the wrong payload; if it shows default text, the SW is stale.
3. Verify the backend uses `content_encoding='aes128gcm'` in `push/services.py`.

### Push notifications are delayed on Android

**Cause:** Usually device-side, not the app. Swiped-away / force-stopped Chrome won't wake the service worker; Render free-tier cold starts can add delay.

**Fix:** Keep Chrome in recents (don't force-stop). Not a code bug.

### "Too many attempts" on login/register

**Cause:** Rate limiting (5/min per IP) or the per-email 5-failure/15-min block.

**Fix:** Wait, or confirm you're not sharing an IP with other testers. `FailedLoginAttempt` rows back the per-email block.

### Stale cached page after a deploy

**Cause:** The PWA service worker serves cached assets until it updates.

**Fix:** Reload the page twice (the new SW activates on the second load), or clear site data once.

## Backend / Deployment

### `GET /api/push/vapid-key/` → 404

**Cause:** The deployed backend is from the **`main`** branch, which predates the push app.

**Fix:** Render dashboard → Settings → Branch → **`dev`** → Save. (Vercel is already on `dev`.)

### `GET /api/push/vapid-key/` → 503

**Cause:** Push app is live but `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` are not in the Render environment.

**Fix:** Add both keys (exact values from `backend/.env`, no extra quotes/spaces).

### Render deploy fails with "Port scan timeout, no open ports"

**Cause:** The web process didn't bind a port in time — often a slow `migrate` or a non-executable start script.

**Fix:**
- The `Procfile` now uses `bash start.sh` (avoids "Permission denied" from a non-executable script).
- Check the deploy log: if it hangs on `migrate`, move migrations to Render's Pre-Deploy Command.
- Render free tier cold-starts slowly; the first request may take ~30–60s.

### Backend up, but images/avatars broken

**Cause:** Cloudinary env vars missing, so media falls back to local storage that isn't served in production.

**Fix:** Set `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` on Render.

### CORS errors in the browser console

**Cause:** The frontend origin isn't in `CORS_ALLOWED_ORIGINS`.

**Fix:** Add the exact origin (e.g. `https://icpep-portal-test.vercel.app`) to the Render env and redeploy.

### Old sessions get 401 after a redeploy

**Cause:** The backend `SECRET_KEY` changed (or the token was signed under a different deployment), invalidating old JWTs.

**Fix:** Users log in again. Keep `SECRET_KEY` stable across deploys.

### Announcements publish but no push is sent

**Cause:** Push only fires at **creation** when `is_published=True`. Re-publishing a draft does not re-send. Also check VAPID env + subscriptions exist.

**Fix:** Create (not just re-publish) to trigger a push; verify VAPID keys and that devices subscribed (`/api/push/subscribe/`).

## Docs / Repository

### Mintlify pages "outside" the docs folder

**Cause:** This is intentional — Mintlify's `docs.json` is at the repo root, so content lives in `pages/` at the root. See [Docs structure explanation](/architecture).

### ESLint / Ruff failures on CI

**Fix:** `cd frontend && npm run lint` (0 errors) and `cd backend && ruff check .` (0 errors) locally before pushing.

## Related Pages

- [Deployment](/deployment)
- [Environment Variables](/environment-variables)
- [Maintenance & Handover](/maintenance-handover)
