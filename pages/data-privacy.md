---
title: Data Privacy
description: Privacy policy and data protection
---

# Data Privacy

## Data Collected

The ICPEP Portal collects and processes the following personal data:

| Data Category | Fields Collected | Purpose |
|---|---|---|
| **Identity** | First name, Last name | Member identification, receipts |
| **Contact** | Email, Phone number, Address | Communication, verification |
| **Academic** | School, Course, Year level | Membership eligibility |
| **Account** | Username, Password (hashed) | Authentication |
| **Payment** | Payment proof images | Transaction verification |
| **Biometric** | Profile picture | ID card, identification |
| **System** | IP addresses, timestamps | Audit logs, security |

## Purpose of Processing

Your data is processed for:

1. **Membership Management** — registration, verification, renewal
2. **Communication** — announcements and chapter updates
3. **Financial Tracking** — payment verification and receipt generation
4. **Compliance** — maintaining chapter records
5. **Security** — audit trails and access control

## Data Subject Rights

Under the Data Privacy Act, you have the right to:

- **Access** — request a copy of your personal data
- **Correction** — update inaccurate information
- **Deletion** — request account deletion (subject to retention requirements)
- **Object** — object to processing of your data
- **Portability** — receive your data in a portable format

To exercise any of these rights, contact the chapter's Data Protection Officer.

## Data Retention

| Data Type | Retention Period |
|---|---|
| Active member profiles | Duration of membership + 1 year |
| Payment proof images | 3 years |
| Audit logs | Indefinite |
| Rejected applications | 1 year |
| Deleted accounts | 30 days (soft delete) |

## Third-Party Processors

| Service | Data Processed | Location |
|---|---|---|
| **Cloudinary** | Images (profile pics, receipts, proofs) | Cloud (US/EU) |
| **Render** | Database, backend hosting | Cloud (US) |
| **Vercel** | Frontend hosting | CDN (global) |
| **PostgreSQL** | All structured data | Render-managed |

## Security Measures

- Passwords hashed with Django's PBKDF2 algorithm
- JWT tokens with 2-hour access + 7-day refresh window
- HTTPS enforced on all endpoints
- CORS restricted to known frontend origins
- Role-based access control (RBAC)
- Upload size limits (10 MB) and format validation
- Audit logging for all admin actions

## Contact

For privacy-related concerns, contact:

**Data Protection Officer** — ICPEP Chapter
Email: icpep.chapter@example.com

## NPC Compliance

This portal is designed to comply with the **Data Privacy Act of 2012 (Republic Act No. 10173)** and its Implementing Rules and Regulations.
