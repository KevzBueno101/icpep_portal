---
title: Screen — Register
description: Membership application form walkthrough
---

# Register (`/register`)

## File

`frontend/src/pages/auth/Register.jsx`

## What it shows

The multi-part membership application form:

1. **Account info + Payment** — email, username, password, confirm password, privacy agreement, payment method, membership plan, GCash details, proof of payment
2. **Personal info** — first/middle/last name, sex
3. **Student info** — student number, course, year level (1–4), section, contact number
4. **Documents** — profile picture, COE/ID (JPG/PNG/PDF, ≤ 10 MB)

## How to move around

| Step | Instruction |
|---|---|
| 1 | Fill account + payment details; the form validates live (email/username availability, password ≥ 8 chars, payment proof) |
| 2 | Fill personal info including sex |
| 3 | Fill student info (student number format `XXXX-XXXXX`, contact `09...`) |
| 4 | Upload profile picture and COE/ID (each ≤ 10 MB) |
| Submit | Agree to the privacy policy, `POST /api/auth/register/`, redirect to `/membership-pending` |

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
