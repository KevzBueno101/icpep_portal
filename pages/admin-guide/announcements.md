---
title: Announcements (Admin)
description: Creating and managing announcements
---

# Announcements

The admin announcements panel lets you create, edit, and manage all chapter announcements.

> ![Admin announcements screenshot](../images/admin-announcements.png)

## Creating an Announcement

Click **Create Announcement** to open the form:

| Field | Required | Description |
|---|---|---|
| Title | ✅ | Announcement headline |
| Content | ✅ | Full announcement text |
| Category | ✅ | Events, News & Updates, Reminders, General |
| Image | ❌ | Optional cover image (max 10 MB) |
| Pinned | ❌ | Keeps post at top of feed |
| Published | ❌ | Visible to users when checked |
| Members Only | ❌ | Visible only to authenticated members |

> ![Create announcement form screenshot](../images/admin-announcement-form.png)

### Options Explained

- **Pinned** — Pinned posts appear at the top of the feed regardless of date
- **Published** — Unpublished posts are saved as drafts (visible only to admins)
- **Members Only** — Check this to hide the post from the public landing page. A purple **Members Only** badge appears on the post

## Editing Announcements

Click the edit icon on any announcement to modify:

- Title, content, category
- Pinned, published, members-only toggles
- Image (upload replacement or remove)

## Deleting Announcements

Click the delete icon to permanently remove an announcement. A confirmation dialog appears.

## Managing Categories

Categories are managed from the admin panel. Available categories:

- Events
- News & Updates
- Reminders
- General

Admins can add or rename categories from the Django admin interface.
