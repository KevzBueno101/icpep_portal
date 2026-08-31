---
title: About Orgs (Admin)
description: Managing dynamic organization content sections
---

# About Orgs

The **About Orgs** admin panel lets you add, edit, delete, and reorder the organization content shown on the member About page: Mission, Vision, Goals, History, Constitution & By-Laws, Resolutions, and custom sections.

## Section Types

| Type | Purpose |
|---|---|
| Mission | Chapter mission statement |
| Vision | Chapter vision statement |
| Goals | Chapter goals |
| History | Chapter history / timeline text |
| Constitution & By-Laws | Governing documents (optionally as a PDF) |
| Resolution | Resolutions (optionally as a PDF) |
| Custom | Any other information (e.g. Core Values) |

## Adding a Section

Click **+ Add Section** to open the form:

| Field | Required | Description |
|---|---|---|
| Section Type | Yes | Mission / Vision / Goals / History / Constitution & By-Laws / Resolution / Custom |
| Title | Yes | Section heading (e.g. "Our Mission") |
| Content | No | Section text. Separate lines render as a bulleted list (useful for Core Values) |
| Document | No | Optional PDF or image (`.pdf`, `.png`, `.jpg`, `.jpeg`) |
| Published | No | When checked, the section is visible on the member About page |

## Editing

Click **Edit** on any section card to update it inline: change type, title, content, publish status, or attach/replace a document. Use **Preview** to view the current attached PDF or image, **Download** to save it, and **Remove** to delete the attachment.

## Reordering

Drag the grip handle on any section card to change its order. The new order is saved automatically and a **Saved** confirmation appears.

## Publishing / Hiding

- **Publish** / **Unpublish** toggles visibility on the member About page.
- Draft sections (unpublished) remain visible to admins only.

## Deleting

Click **Delete** and confirm — the section and its attached file are permanently removed.

## Default Content

The repo ships a data migration that seeds the original Mission, Vision, and Core Values as published sections. The member About page falls back to that same text if the API returns no sections, so the page is never blank.

## Related Pages

- [API Reference: About](/api-reference/about)
- [Screen: Admin About](/screens/admin-about)
- [Screen: Member About](/screens/member-about)