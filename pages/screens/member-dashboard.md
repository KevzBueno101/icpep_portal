---
title: Screen — Member Dashboard
description: Member home page walkthrough
---

# Member Dashboard (`/member/dashboard`)

## File

`frontend/src/pages/member/MemberDashboard.jsx`

## What it shows

The logged-in member's home:

- Welcome banner ("Welcome back, [name]")
- The **2 most recent announcements**
- Payment settings summary (GCash number/name)
- "Member since" info
- Navigation into ID card, announcements, profile

## How to move around

| Action | Result |
|---|---|
| Click an announcement | Opens the announcement detail |
| Click **ID card** | Goes to `/member/id` |
| Click **Notifications** / **Enable Notifications** | Toggles push (see toggle below) |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/members/` | Member profile (via MemberProvider) |
| `GET /api/members/payment-settings/` | GCash info |
| `GET /api/announcements/?include_members_only=1` | Recent announcements |

## Notification toggle

The `NotificationToggle` component (also on the landing feed) shows states: **Checking → Enable Notifications → Notifications On / Blocked / Unsupported**. Enabling requests browser permission, fetches the VAPID key, and stores the push subscription.

## Notes

- Uses `MemberProvider` (`MemberContext.jsx`), which refetches on tab focus.
- Requires `membership_status === 'APPROVED'` (enforced by `ProtectedRoute`).

## Related Pages

- [Screen: Member Announcements](/screens/member-announcements)
- [Screen: Member ID Card](/screens/member-id-card)
- [Screen: Member Profile](/screens/member-profile)
- [Flow: Announcements & Push](/flows/announcements-push)
