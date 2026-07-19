---
title: Member ID Card
description: Digital membership ID card with QR verification
---

# Member ID Card

Every approved member receives a **digital membership ID card** that serves as their official ICPEP.SE student membership pass for the academic year.

> ![Member ID Card screenshot](../images/member-id-card.svg)

## Card Features

### Front Side

- **ICPEP.SE Logo** â€” Chapter branding at the top
- **Membership ID Card** â€” Title indicating card type
- **Academic Year** â€” "Valid for 1 Academic Year" notice

### Back Side

Tap or click the **Flip Card** button to see the reverse side with:

- **Organization Details** â€” Institute of Computer Engineers of the Philippines, Student Edition, College of Engineering and Architecture, Catanduanes State University
- **Profile Photo** â€” Your uploaded profile picture
- **Full Name** â€” Displayed prominently
- **Course & Year** â€” Your course and year level
- **QR Code** â€” Unique verification payload (`ICPEP|{student_number}|{name}|{section}|{user_id}`)
- **Student Number** â€” Your student ID number
- **Section** â€” Your block/section
- **Academic Year** â€” Current membership period
- **Official Seal** â€” ICpEP chapter seal

## How to Access

1. Log in to your member account
2. Navigate to **Digital ID Card** from the sidebar or profile menu
3. The card loads automatically with your profile information

> ![Digital ID Card page screenshot](../images/digital-id-card-page.svg)

## Download

Click **Download ID Card (PNG)** to save a high-resolution copy of your card (front and back side-by-side). This is useful for:

- Printing a physical copy
- Saving offline
- Sharing with verification purposes

## QR Code Verification

The QR code on the back of the card contains an encoded payload with your membership data. Authorized personnel can scan this code to verify:

- Your membership status
- Student identity
- Academic year validity

## Technical Details

- **Responsive** â€” Card auto-scales to fit any screen size
- **Flip Animation** â€” Smooth 3D flip transition
- **Canvas Export** â€” Uses `html2canvas` with 3x scale for high-resolution PNG output
- **CORS Handling** â€” Profile pictures loaded with CORS support for cross-origin images
