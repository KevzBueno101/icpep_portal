---
title: Screen — Register
description: Membership application form walkthrough
---

# Register (`/register`)

## File

`frontend/src/pages/auth/Register.jsx`

## What it shows

The multi-part membership application form:

1. **Account info** — email, username, password, confirm password
2. **Personal info** — first/middle/last name, student number, course, year level (1–4), section (A/B/C/D suggestions), contact number
3. **Documents** — profile picture, payment proof, COE/ID (JPG/PNG/PDF, ≤ 10 MB)
4. **Payment** — payment method (GCash default), GCash number/name display, copy-to-clipboard
5. **Agreement** — privacy policy checkbox (opens `PrivacyPolicyModal`)

## How to move around

| Step | Instruction |
|---|---|
| 1 | Fill account + personal info; the form validates live (email/username availability, student number format `XXXX-XXXXX`, contact `09...`, password ≥ 8 chars) |
| 2 | Upload the three images (each ≤ 10 MB; proofs retry up to 2× with 5s delay) |
| 3 | Agree to the privacy policy |
| 4 | Submit — `POST /api/auth/register/` |
| 5 | On success, redirect to `/membership-pending` |

## Key API calls

| Endpoint | Use |
|---|---|
| `POST /api/auth/register/` | Create user + member profile |
| `GET /api/auth/availability/` | Pre-check email/username |

## Notes

- Registration creates a **PENDING** member (see [Registration flow](/flows/member-registration)).
- JWT tokens are returned on success so the member can log in immediately.
- On rejection the form surfaces field-level errors (toast).

## Preview

![Registration form preview](/images/registration-form.svg)

## Related Pages

- [Flow: Member Registration](/flows/member-registration)
- [Screen: Membership Pending](/screens/membership-pending)
- [User Guide: Members](/user-guide/members)
