---
title: Payments
description: Payment methods, e-receipts, and payment history
---

# Payments

## Payment Methods

The ICPEP Portal supports two payment methods:

### GCash

Select **GCash** as your payment method to see the chapter's GCash account details:

- GCash number
- Account name

Upload a screenshot of your payment confirmation as **payment proof**.

> ![GCash payment section screenshot](../images/gcash-payment.png)

### On-Hand

Select **On-hand** if you prefer to pay in person to a designated officer. No upload required — the system notes your intent, and the officer confirms receipt during verification.

## Payment Proof

Payment proof is an image uploaded during registration or renewal:

- **Accepted formats**: JPG, PNG, GIF, WebP
- **Maximum size**: 10 MB
- Used by admins to verify your payment
- Stored securely on Cloudinary

## E-Receipts

When an admin approves your membership or renewal, an **e-receipt** is automatically generated:

> ![E-receipt screenshot](../images/e-receipt.png)

### Receipt Details

Each e-receipt includes:

- ICPEP Logo
- Reference Number (e.g., `ICPEP-2026-0001`)
- Member Name
- Date of Approval
- Transaction Type (Registration / Renewal)
- Payment Method
- Status (VERIFIED)
- Academic Year
- Authorized Signatory (approving admin's name)
- Payment Proof Thumbnail

### Payment History

Your Payment History table shows all transactions:

| Column | Description |
|---|---|
| **Reference #** | Unique transaction identifier |
| **Date** | Date of approval |
| **Type** | Registration or Renewal |
| **Method** | GCash or On-hand |
| **Status** | VERIFIED, PENDING, or REJECTED |
| **Receipt** | Link to view/download e-receipt |
| **Proof** | Link to view payment proof |

> ![Payment history screenshot](../images/payment-history.png)
