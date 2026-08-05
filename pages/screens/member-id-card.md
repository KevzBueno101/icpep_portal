---
title: Screen — Member ID Card
description: Digital member ID card, flip card, QR code, and PNG download
---

# Member ID Card (`/member/id`)

## File

`frontend/src/pages/member/MemberIdCard.jsx` + `components/member/MembershipCard.jsx`

## What it shows

A **flip-style digital ID card**:

- **Front:** member photo, name, student number, section, course, validity
- **Back:** QR code + ID number, block, academic year (e.g. "A.Y 2025–2026")
- **Download ID Card (PNG)** button

## How to move around

| Action | Result |
|---|---|
| Flip the card | Toggles front/back |
| Scan the QR | Encodes `ICPEP|student_number|fullName|section|userId` |
| Click **Download ID Card (PNG)** | Exports via `html2canvas` at 3× scale → `ICpEP_Card_<student_number>.png` |

## Key API calls

| Endpoint | Use |
|---|---|
| `GET /api/members/` | Profile data for the card |

## Notes

- The export renders an off-screen, inline-styled block to capture a clean image.
- Photo URL resolution handles Cloudinary absolute URLs, `/media/...` relative paths (resolved against backend origin), or raw IDs (`utils/profilePicture.js`).

## Preview

![Member ID card preview](/images/member-id-card.svg)

![Digital ID card page preview](/images/digital-id-card-page.svg)

## Related Pages

- [User Guide: Member ID Card](/user-guide/member-id-card)
- [Screen: Admin Officer ID](/screens/admin-officer-id)
