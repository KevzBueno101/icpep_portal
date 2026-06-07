# TODO - Dynamic Admin Profile Picture + Editable Profile Fields

## Completed
- [x] Make Admin profile picture updates reflect in Admin Sidebar/Profile by refreshing `AuthContext.user` after saving from `frontend/src/pages/admin/AdminProfile.jsx`.

## Next
- [ ] Investigate why UI circle still doesn’t update: confirm `/api/auth/me/` returned `profile_picture` changed and matches AdminSidebar image `src`.
- [ ] Implement “Admin Profile: editable all fields including password” for **all admins** (frontend form + backend serializer + backend view permissions).
- [ ] Add password fields (password + confirm_password optional) to `AdminProfile.jsx` UI + submit payload.
- [ ] Update backend `AdminProfileAPIView` to allow password in PATCH + implement `set_password`.
- [ ] Ensure frontend uses `multipart/form-data` correctly when profile_picture is present alongside password.

