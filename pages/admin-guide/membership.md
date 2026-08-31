---
title: Membership Management
description: Managing members from the admin panel
---

# Membership Management

## Members List

The members page displays a paginated table of all registered members with search, filter, and sort capabilities.

> ![Members list screenshot](../images/admin-members-list.svg)

### Columns

| Column | Description |
|---|---|
| **Name** | Member's full name |
| **Status** | APPROVED / PENDING / REJECTED / EXPIRED |
| **School** | Institution name |
| **Course** | Course and year level |
| **Actions** | Verify, History, Edit, Delete |

### Tools

- **Search** â€” filter by name or email
- **Status Filter** â€” dropdown to filter by status
- **Year Filter** â€” filter by academic year
- **Pagination** â€” 25 members per page

## Verifying Members

Click the **Verify** button on a pending member to open the verification page:

1. Review the member's submitted details and payment proof image
2. Choose an action:
   - **Approve** â€” sets status to APPROVED, generates e-receipt, sends notification
   - **Reject** â€” sets status to REJECTED with an optional reason message
3. Click confirm

> ![Verify member screenshot](../images/admin-verify.svg)

### Auto-Generated E-Receipt

When you approve a member, the system automatically:

1. Creates a `PaymentTransaction` record
2. Copies the `payment_proof_image` from the profile
3. Generates a sequential reference number (`ICPEP-{YEAR}-{SEQUENTIAL:04d}`)
4. Renders an e-receipt PNG with Pillow (800Ã—700 canvas)
5. Uploads the receipt to Cloudinary
6. Associates the receipt with the transaction

The authorized signatory on the receipt is your full name.

## Details

Click **History** on any member to view their payment transactions and member ID:

> ![Transaction history modal screenshot](../images/admin-history.svg)

Each transaction shows:

- Member ID number + **Download** (prints the member's ID card)
- Reference number (clickable receipt link)
- Transaction date
- Type (Registration / Renewal)
- Payment method (GCash / On-hand)
- Status (VERIFIED / PENDING / REJECTED)
- Receipt image link
- Payment proof image link

The modal also embeds the full member ID card with its built-in **Download ID Card (PNG)** button.

## Editing Members

Click **Edit** to modify a member's details:

- Name, email, contact number
- School, course, year
- Membership status
- Profile picture

## Deleting Members

Click **Delete** to remove a member permanently. A confirmation dialog appears before deletion.

> Deletion is permanent and cannot be undone.

## Adding Members Manually

Admins can create member accounts directly from the admin panel using the **Add Member** button.

## Year-End Reset (Renew All)

At the end of an academic year, use the **Renew All** button to mass-renew all members. This:

1. Creates a new academic year period
2. Transitions approved members to the new year
3. Marks previous year members as needing renewal
