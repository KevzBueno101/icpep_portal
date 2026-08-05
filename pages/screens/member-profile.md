---
title: Screen — Member Profile
description: Member profile viewing/editing, profile picture upload, and password change
---

# Member Profile (`/member/profile`)

## File

`frontend/src/pages/member/MemberProfile.jsx`

## What it shows

- View mode: personal info, contact, year level/section, photo
- **Edit mode:** first/middle/last name, contact number, year level, section, address, birthdate
- **Change password** (current/new/confirm, ≥ 8 chars)
- **Profile picture upload** with preview (≤ 10 MB, image only)

## How to move around

| Action | Result |
|---|---|
| Edit → save | `PUT/PATCH /api/members/<pk>/` |
| Change password | `POST /api/auth/change-password/` |
| Upload photo | Image file → profile picture (validated) |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/members/` | Load own profile |
| `PUT`/`PATCH /api/members/<pk>/` | Save edits (owner or manager) |
| `POST /api/auth/change-password/` | Change password (blacklists refresh tokens) |

## Notes

- Saving profile fires the `profile-updated` event so the ID card + dashboard refresh.
- Password change forces re-login (tokens blacklisted).

## Preview

![Member profile preview](/images/member-profile.svg)

## Related Pages

- [User Guide: Members](/user-guide/members)
- [Flow: Auth & Sessions](/flows/auth-session)
