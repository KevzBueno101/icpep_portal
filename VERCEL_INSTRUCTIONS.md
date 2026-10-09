# ERR_BLOCKED_BY_CLIENT Fix - Vercel Dashboard Instructions

## Problem
The error `ERR_BLOCKED_BY_CLIENT` occurs when creating events because ad blockers block Cloudflare Workers domains (`.workers.dev`).

## Solution
Update Vercel dashboard environment variables for the **dev project** to use the direct Render backend URL instead of the Cloudflare Worker proxy.

## Required Changes in Vercel Dashboard

For the **dev project** (icpep-catsu.vercel.app), update these environment variables:

1. **VITE_API_URL**
   - FROM: `https://icpep-api.icpep-se-catsuchapter.workers.dev/api`
   - TO: `https://icpep-backend-mriy.onrender.com/api`

2. **VITE_BACKEND_URL**
   - FROM: `https://icpep-api.icpep-se-catsuchapter.workers.dev`
   - TO: `https://icpep-backend-mriy.onrender.com`

3. **VITE_WS_URL**
   - FROM: `wss://icpep-api.icpep-se-catsuchapter.workers.dev`
   - TO: `wss://icpep-backend-mriy.onrender.com`

## Code Changes Already Made

1. **Backend CORS settings updated** (`backend/config/settings.py`)
   - Added worker domains to `CORS_ALLOWED_ORIGINS` as backup
   - This ensures requests work even if using the worker proxy

2. **Backend permissions updated** (`backend/featured/views.py`, `backend/events/views.py`)
   - Added `AllowAny` permission to public API views (landing page access)
   - Admin operations still require authentication

3. **Local .env updated** (`frontend/.env`)
   - Added comment explaining the direct backend URL usage
   - Already pointing to direct Render backend

## Verification Steps

After updating Vercel dashboard:
1. Redeploy the dev project (Vercel will auto-deploy on env var change)
2. Test creating an event in admin panel
3. Test creating featured content
4. Verify no ERR_BLOCKED_BY_CLIENT error
5. Verify landing page loads featured content and events without authentication

## Production Note

The production environment (icpepcatsu.app) should continue using the Cloudflare Worker proxy (`icpep-api-main`) as configured in `frontend/.env.production`. The worker domains are now whitelisted in CORS settings.
