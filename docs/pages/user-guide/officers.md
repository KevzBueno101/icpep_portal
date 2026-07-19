---
title: Officers
description: Officer ID cards, positions, and roles
---

# Officers

Officers are members who hold a position in the chapter. They have additional privileges based on their role.

## Officer ID Card

Each officer gets a digital ID card with:

- Profile photo
- Full name
- Position title (e.g., President, Secretary, Treasurer)
- Member ID
- QR code for verification

The ID card auto-scales to fit your screen — rotate your phone to landscape for a larger view.

> ![Officer ID card screenshot](../images/officer-card.png)

### ID Card Features

- **ResizeObserver-based scaling** — card fits perfectly on any screen size
- **Cache-busting** — profile picture updates immediately (no stale cache)
- **QR Code** — generated dynamically for verification purposes

## Positions & Privileges

| Position | Access |
|---|---|
| **President** | Automatic FULL_CONTROL — can manage everything |
| **Vice President** | Administrative access |
| **Secretary** | Can be delegated admin tasks |
| **Treasurer** | Payment/membership management |
| **Auditor** | View-only access to records |
| **Public Information Officer** | Announcements management |
| **Business Manager** | Membership management |
| **Other Officers** | Varies by assigned role |

## Secretary Delegation

The President can delegate administrative authority to the Secretary, allowing them to:

- Approve/reject membership applications
- Manage announcements
- Access the admin dashboard

This is configured from the **Admin → Officers** page.
