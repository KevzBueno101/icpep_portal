# TODO - Profile Picture Debug and Fix

## Plan (approved)

1. Add a frontend helper to build an absolute image URL from the serialized `profile_picture` value.
2. Replace hardcoded `http://127.0.0.1:8000${...}` usage in all profile-picture renderers.
   - AdminSidebar
   - AdminProfile page
   - AdminAdmins/officer cards area (where admin/officer listing uses profile picture)
3. Update backend CSP (`img-src`) to allow the frontend-served backend origin used in development.
4. Run basic smoke tests:
   - Load `/auth/me/` response and confirm `profile_picture` is present.
   - Verify profile picture loads on Sidebar and Admin Profile after refresh.
   - Verify after upload via EditAdminProfile, Sidebar/Profile/Officers update.

