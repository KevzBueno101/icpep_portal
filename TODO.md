# TODO - Fix & Dynamicize Admin Profile Page

## Backend
- [x] Add `AdminProfileSerializer` to `backend/users/serializers.py`
- [x] Verify `AdminProfileAPIView` now returns 200 for `GET /api/users/admin/profile/`
  - [x] `python manage.py check`
  - [x] `python manage.py debug_admin_profile --user-id <id>`

## Frontend
- [ ] Update `frontend/src/hooks/useAdminProfile.js` to return `{ profile, loading, error, refetch, profilePictureUrl }`
- [ ] Update `frontend/src/pages/admin/AdminProfile.jsx` to consume the new hook shape and render fields dynamically
- [ ] Verify edit flow loads pre-populated data (optional: update `EditAdminProfile.jsx` if needed)

## Verification
- [ ] Confirm Admin Profile page shows Name, Email, Role, Position, Photo
- [ ] Confirm Edit form saves profile picture with cache-busting
- [ ] Confirm password change requires current password

