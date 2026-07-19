---
title: Architecture
description: System architecture, auth flow, and permissions
---

# Architecture

## High-Level Diagram

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     HTTP      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     SQL      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   React     â”‚ â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º  â”‚   Django REST â”‚ â—„â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â–º â”‚ PostgreSQL â”‚
â”‚   Frontend  â”‚   JWT Auth    â”‚   Framework   â”‚              â”‚            â”‚
â”‚  (Vercel)   â”‚               â”‚   (Render)    â”‚              â”‚            â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜               â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                                      â”‚
                                      â–¼
                              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                              â”‚   Cloudinary   â”‚
                              â”‚ (Images, Docs) â”‚
                              â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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
ADMIN â”€â”€> OFFICER â”€â”€> MEMBER
```

- **ADMIN**: Full system access, can manage other admins
- **OFFICER**: Administrative access with assigned position
- **MEMBER**: Can view profile, renew, see announcements

## Permission Matrix

| Access Level | Members CRUD | Announcements CRUD | Achievements CRUD | Admins CRUD | Own Profile |
|---|---|---|---|---|---|
| **FULL_CONTROL** | âœ… | âœ… | âœ… | âœ… | âœ… |
| **MEMBERSHIP** | âœ… | âœ… | âœ… | âŒ | âœ… |
| **RESTRICTED** | âŒ | âŒ | âŒ | âŒ | âœ… |

> **Note**: The **President** position always has FULL_CONTROL regardless of their `access_level` field.

## Data Flow: Registration â†’ Approval â†’ Receipt

```
Member Registers â”€â”€> PENDING status
       â”‚
       â–¼
Admin Reviews â”€â”€> Approves or Rejects with message
       â”‚
       â–¼ (if approved)
Member Profile updated to APPROVED
PaymentTransaction + E-Receipt created
       â”‚
       â–¼
Member sees APPROVED status + Receipt in Payment History
```

## Directory Structure

```
icpep_portal/
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ members/           # Member management app
â”‚   â”‚   â”œâ”€â”€ views.py       # API views
â”‚   â”‚   â”œâ”€â”€ serializers.py # DRF serializers
â”‚   â”‚   â”œâ”€â”€ models.py      # Data models
â”‚   â”‚   â”œâ”€â”€ receipt_generator.py  # E-receipt generation
â”‚   â”‚   â””â”€â”€ urls.py        # URL routing
â”‚   â”œâ”€â”€ announcements/     # Announcements app
â”‚   â”œâ”€â”€ users/             # Admin/officer management
â”‚   â”œâ”€â”€ permissions.py     # Custom permissions
â”‚   â””â”€â”€ icpep_backend/     # Project settings
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ pages/         # React page components
â”‚   â”‚   â”œâ”€â”€ components/    # Shared components
â”‚   â”‚   â”œâ”€â”€ context/       # React contexts
â”‚   â”‚   â””â”€â”€ App.jsx        # Root component
â”‚   â””â”€â”€ public/            # Static assets
â””â”€â”€ docs/                  # This documentation
```
