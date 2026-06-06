# TODO - Admin Profile Feature

## Backend
- [x] Update `backend/users/serializers.py`:
  - [x] Make `first_name` + `last_name` writable
  - [x] Add validation (max 150 chars; allow blank)
  - [x] Keep all other fields read-only
- [x] Update `backend/users/views.py`:
  - [x] Implement PATCH support on admin profile endpoint
  - [x] Ensure only `first_name` and `last_name` can be patched
  - [x] Return 400 for unauthorized fields
  - [x] Return updated profile data
- [ ] Confirm endpoint wiring in `backend/users/urls.py` (no route regressions)


## Frontend
- [x] Implement full `frontend/src/pages/admin/AdminProfile.jsx`
  - [x] GET profile + loading/error states + retry
  - [x] Render badges + info card layout
  - [x] Edit button → `/admin/edit-profile`
  - [x] Logout button
- [x] Create `frontend/src/pages/admin/EditAdminProfile.jsx`
  - [x] GET current profile for initial values
  - [x] PATCH first/last name
  - [x] Loading/saving states + validation
  - [x] Toast success + navigation/back/cancel
- [x] Upgrade `frontend/src/components/admin/AdminSidebar.jsx`
  - [x] lucide-react icons
  - [x] User dropdown: View Profile, Edit Profile, Logout
  - [x] Mobile overlay close on navigation
- [x] Update `frontend/src/App.jsx`
  - [x] Wire `/admin/profile` to new `AdminProfile.jsx`
  - [x] Add `/admin/edit-profile` route


## Verification
- [x] Backend manual check:
  - [ ] GET `/api/users/admin/profile/`
  - [ ] PATCH with valid payload updates names
  - [ ] PATCH with forbidden fields returns 400
- [x] Frontend manual check:
  - [x] `/admin/profile` loads
  - [ ] `/admin/edit-profile` loads and saves
  - [ ] Sidebar dropdown and logout work (desktop + mobile)
- [ ] Lint/build check (optional)


