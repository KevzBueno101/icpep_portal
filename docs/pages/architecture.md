---
title: Architecture
description: System architecture, auth flow, and permissions
---

# Architecture

## High-Level Diagram

```
┌─────────────┐     HTTP      ┌───────────────┐     SQL      ┌────────────┐
│   React     │ ◄──────────►  │   Django REST │ ◄──────────► │ PostgreSQL │
│   Frontend  │   JWT Auth    │   Framework   │              │            │
│  (Vercel)   │               │   (Render)    │              │            │
└─────────────┘               └───────┬───────┘              └────────────┘
                                      │
                                      ▼
                              ┌───────────────┐
                              │   Cloudinary   │
                              │ (Images, Docs) │
                              └───────────────┘
```

## Authentication Flow

1. User submits credentials via `POST /api/auth/login/` or `POST /api/auth/admin-login/`
2. Backend validates credentials and returns JWT **access** (2h) and **refresh** (7d) tokens
3. Frontend stores tokens in `localStorage` (access) and optionally the refresh token
4. Every API request includes `Authorization: Bearer <access_token>`
5. When access token expires, frontend calls `POST /api/auth/refresh/` to get a new one
6. Tokens are cleared on logout

## Role Hierarchy

```
ADMIN ──> OFFICER ──> MEMBER
```

- **ADMIN**: Full system access, can manage other admins
- **OFFICER**: Administrative access with assigned position
- **MEMBER**: Can view profile, renew, see announcements

## Permission Matrix

| Access Level | Members CRUD | Announcements CRUD | Achievements CRUD | Admins CRUD | Own Profile |
|---|---|---|---|---|---|
| **FULL_CONTROL** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **MEMBERSHIP** | ✅ | ✅ | ✅ | ❌ | ✅ |
| **RESTRICTED** | ❌ | ❌ | ❌ | ❌ | ✅ |

> **Note**: The **President** position always has FULL_CONTROL regardless of their `access_level` field.

## Data Flow: Registration → Approval → Receipt

```
Member Registers ──> PENDING status
       │
       ▼
Admin Reviews ──> Approves or Rejects with message
       │
       ▼ (if approved)
Member Profile updated to APPROVED
PaymentTransaction + E-Receipt created
       │
       ▼
Member sees APPROVED status + Receipt in Payment History
```

## Directory Structure

```
icpep_portal/
├── backend/
│   ├── members/           # Member management app
│   │   ├── views.py       # API views
│   │   ├── serializers.py # DRF serializers
│   │   ├── models.py      # Data models
│   │   ├── receipt_generator.py  # E-receipt generation
│   │   └── urls.py        # URL routing
│   ├── announcements/     # Announcements app
│   ├── users/             # Admin/officer management
│   ├── permissions.py     # Custom permissions
│   └── icpep_backend/     # Project settings
├── frontend/
│   ├── src/
│   │   ├── pages/         # React page components
│   │   ├── components/    # Shared components
│   │   ├── context/       # React contexts
│   │   └── App.jsx        # Root component
│   └── public/            # Static assets
└── docs/                  # This documentation
```
