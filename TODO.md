# TODO — AdminMembership Actions Column (Verify, Edit, Delete)

## Context & File Reference

- **Target file**: `frontend/src/pages/admin/placeholder/AdminMembership.jsx`
- **Related files**:
  - `frontend/src/api/axios.js` — API client (use `api` default export for authenticated requests)
  - `frontend/src/components/admin/ProofModal.jsx` — existing modal component for proof viewing
  - `frontend/src/components/common/ConfirmModal.jsx` — existing confirm/alert modal
  - `frontend/src/pages/admin/AdminMembershipVerify.jsx` — the Verify page (navigate to this)
  - `backend/members/views.py` — `MemberApproveAPIView` at `POST /api/members/{id}/approve/`
  - `backend/members/serializers.py` — `MemberProfileSerializer` (fields available for edit)

---

## Current State (What Exists Already)

Inside `AdminMembership.jsx`, the Actions column (`<td>`) already has this partial logic:

### Desktop table (hidden md:block) — current actions:
```jsx
// For PENDING or non-APPROVED members:
<button onClick={() => navigate(`/admin/membership/${member.id}/verify`)}>
  <CheckCircle /> {/* Verify */}
</button>
<button onClick={() => handleUpdateStatus(member.id, 'REJECTED')}>
  <XCircle /> {/* Reject */}
</button>

// For APPROVED members:
<button onClick={() => toast.info('Edit is not implemented yet.')}>
  <FileDown /> {/* placeholder Edit */}
</button>
<button onClick={() => toast.info('Delete is not implemented yet.')}>
  <X /> {/* placeholder Delete */}
</button>
```

### Mobile cards (md:hidden) — current actions:
```jsx
// For PENDING:
<button onClick={() => navigate(`/admin/membership/${member.id}/verify`)}>Verify</button>
<button onClick={() => handleUpdateStatus(member.id, 'REJECTED')}>Reject</button>

// For APPROVED:
<button onClick={() => handleUpdateStatus(member.id, 'EXPIRED')}>Expire Membership</button>
```

---

## What Needs to Be Done

### 1. DESKTOP TABLE — Fix the Actions Column

**Replace the existing conditional action buttons** with a unified set of 3 buttons shown for ALL members regardless of status:

| Button | Icon (lucide-react) | Behavior |
|--------|-------------------|----------|
| Verify | `CheckCircle` (w-3.5 h-3.5) | `navigate('/admin/membership/${member.id}/verify')` |
| Edit | `PencilLine` (w-3.5 h-3.5) | Open an inline Edit Modal (see Task 3 below) |
| Delete | `Trash2` (w-3.5 h-3.5) | Open a ConfirmModal, then call DELETE API (see Task 4 below) |

**Exact button styling to use** (match existing icon button style in the file):

```jsx
// Verify button
<button
  type="button"
  onClick={() => navigate(`/admin/membership/${member.id}/verify`)}
  className="rounded-full bg-sky-50 p-1.5 text-sky-700 hover:bg-sky-100 border border-sky-200 transition"
  title="Verify"
>
  <CheckCircle className="w-3.5 h-3.5" />
</button>

// Edit button
<button
  type="button"
  onClick={() => handleOpenEditModal(member)}
  className="rounded-full bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
  title="Edit"
>
  <PencilLine className="w-3.5 h-3.5" />
</button>

// Delete button
<button
  type="button"
  onClick={() => setDeleteTarget(member)}
  className="rounded-full bg-red-50 p-1.5 text-red-700 hover:bg-red-100 border border-red-200 transition"
  title="Delete"
>
  <Trash2 className="w-3.5 h-3.5" />
</button>
```

The 3 buttons must be wrapped in the existing `opacity-0 group-hover:opacity-100` div so they only appear on row hover — **do not change this behavior**.

---

### 2. MOBILE CARDS — Fix the Action Buttons

**Replace** the current conditional mobile buttons with the same 3 unified actions:

```jsx
// In the expanded mobile card section (isExpanded && ...)
<div className="grid gap-2">
  <button
    type="button"
    onClick={() => navigate(`/admin/membership/${member.id}/verify`)}
    className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition"
  >
    <span className="flex items-center justify-center gap-2">
      <CheckCircle className="w-4 h-4" />
      Verify
    </span>
  </button>

  <button
    type="button"
    onClick={() => handleOpenEditModal(member)}
    className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition"
  >
    <span className="flex items-center justify-center gap-2">
      <PencilLine className="w-4 h-4" />
      Edit
    </span>
  </button>

  <button
    type="button"
    onClick={() => setDeleteTarget(member)}
    className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition"
  >
    <span className="flex items-center justify-center gap-2">
      <Trash2 className="w-4 h-4" />
      Delete
    </span>
  </button>
</div>
```

---

### 3. EDIT MODAL — New State & Component

#### 3a. Add new state variables at the top of the `AdminMembership` component (alongside existing state):

```jsx
const [editTarget, setEditTarget] = useState(null)       // member object being edited
const [editForm, setEditForm] = useState({})             // form fields
const [isEditSubmitting, setIsEditSubmitting] = useState(false)
```

#### 3b. Add handler functions:

```jsx
const handleOpenEditModal = (member) => {
  setEditTarget(member)
  setEditForm({
    first_name: member.first_name || '',
    middle_name: member.middle_name || '',
    last_name: member.last_name || '',
    student_number: member.student_number || '',
    course: member.course || '',
    year_level: member.year_level || '1',
    section: member.section || '',
    contact_number: member.contact_number || '',
    membership_status: member.membership_status || 'PENDING',
  })
}

const handleEditFormChange = (e) => {
  const { name, value } = e.target
  setEditForm((prev) => ({ ...prev, [name]: value }))
}

const handleEditSubmit = async (e) => {
  e.preventDefault()
  if (!editTarget) return
  setIsEditSubmitting(true)
  try {
    const response = await api.patch(`/members/${editTarget.id}/`, editForm)
    setMembers((prev) =>
      prev.map((m) => (m.id === editTarget.id ? response.data : m))
    )
    toast.success('Member updated successfully.')
    setEditTarget(null)
  } catch (err) {
    const errors = err.response?.data
    if (errors) {
      const firstKey = Object.keys(errors)[0]
      const rawErr = errors[firstKey]
      const errorMsg = Array.isArray(rawErr) ? rawErr[0] : rawErr
      toast.error(`${firstKey.replace('_', ' ')}: ${errorMsg}`)
    } else {
      toast.error('Failed to update member.')
    }
  } finally {
    setIsEditSubmitting(false)
  }
}
```

#### 3c. Add Edit Modal JSX — place it at the bottom of the component return, AFTER the existing Add Member Modal closing `</div>` tag and BEFORE the final component closing:

```jsx
{/* Edit Member Modal */}
{editTarget && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
    <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-950">Edit Member</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Editing: {editTarget.first_name} {editTarget.last_name}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditTarget(null)}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Body */}
      <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">

        {/* Name Fields */}
        <div>
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                required
                value={editForm.first_name}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
              <input
                type="text"
                name="middle_name"
                value={editForm.middle_name}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                required
                value={editForm.last_name}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
          </div>
        </div>

        {/* Academic Fields */}
        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Academic Info</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="student_number"
                required
                value={editForm.student_number}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
              <input
                type="text"
                name="course"
                value={editForm.course}
                readOnly
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Year Level <span className="text-red-500">*</span>
              </label>
              <select
                name="year_level"
                required
                value={editForm.year_level}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Section <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="section"
                required
                value={editForm.section}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="contact_number"
                required
                value={editForm.contact_number}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Membership Status</label>
              <select
                name="membership_status"
                value={editForm.membership_status}
                onChange={handleEditFormChange}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setEditTarget(null)}
            disabled={isEditSubmitting}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isEditSubmitting}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition disabled:opacity-70 flex items-center gap-2"
          >
            {isEditSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-white" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  </div>
)}
```

---

### 4. DELETE — New State & Handler

#### 4a. Add new state (alongside existing state at top of component):

```jsx
const [deleteTarget, setDeleteTarget] = useState(null)   // member object to delete
const [isDeleting, setIsDeleting] = useState(false)
```

#### 4b. Add delete handler:

```jsx
const handleDeleteMember = async () => {
  if (!deleteTarget) return
  setIsDeleting(true)
  try {
    // The backend does not have a dedicated member DELETE endpoint yet.
    // Use the approve endpoint to set status to EXPIRED as a soft delete,
    // OR if a DELETE /api/members/{id}/ endpoint exists, use that instead.
    // For now, soft-delete by setting membership_status to 'EXPIRED':
    const response = await api.post(`/members/${deleteTarget.id}/approve/`, {
      membership_status: 'EXPIRED',
    })
    setMembers((prev) =>
      prev.map((m) => (m.id === deleteTarget.id ? response.data : m))
    )
    toast.success(`${deleteTarget.first_name} ${deleteTarget.last_name}'s membership has been removed.`)
    setDeleteTarget(null)
  } catch (err) {
    toast.error(err.response?.data?.detail || 'Failed to delete member.')
  } finally {
    setIsDeleting(false)
  }
}
```

> **NOTE for developer**: If a true hard DELETE is needed, add `DELETE /api/members/{id}/` to `backend/members/views.py` in `MemberRetrieveUpdateAPIView` by adding `'DELETE'` to http_method_names and a `perform_destroy` method, then update the handler above to use `api.delete(\`/members/${deleteTarget.id}/\`)` and filter out the member from state with `setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id))`.

#### 4c. Add Delete Confirmation Modal JSX — place it AFTER the Edit Modal JSX, BEFORE the final return closing tag:

```jsx
{/* Delete Confirmation Modal */}
<ConfirmModal
  isOpen={Boolean(deleteTarget)}
  variant="caution"
  title="Delete member?"
  description={
    deleteTarget
      ? `This will remove ${deleteTarget.first_name} ${deleteTarget.last_name} (${deleteTarget.student_number}) from the membership list. This action cannot be undone.`
      : ''
  }
  confirmText="Delete"
  cancelText="Cancel"
  busy={isDeleting}
  onConfirm={handleDeleteMember}
  onCancel={() => setDeleteTarget(null)}
/>
```

---

### 5. IMPORTS — Ensure These Are Present

At the top of `AdminMembership.jsx`, the import from `lucide-react` must include `PencilLine` and `Trash2`. The current import line is:

```jsx
import { ChevronDown, Search, FileDown, Plus, CheckCircle, XCircle, Archive, AlertCircle, RefreshCw, X, PencilLine, Trash2 } from 'lucide-react'
```

`PencilLine` and `Trash2` are already listed — **confirm they are present, do not duplicate**.

Also ensure `ConfirmModal` is imported (it is NOT currently imported in this file):

```jsx
import ConfirmModal from '../../../components/common/ConfirmModal'
```

---

### 6. BACKEND — No Changes Required for Edit

The `PATCH /api/members/{id}/` endpoint already exists in `MemberRetrieveUpdateAPIView` in `backend/members/views.py`. The `MemberProfileSerializer` already includes `first_name`, `middle_name`, `last_name`, `student_number`, `year_level`, `section`, `contact_number` as editable fields. No backend changes needed for Edit.

---

## Summary Checklist

- [ ] Desktop table: Replace conditional action buttons with unified Verify + Edit + Delete (3 buttons, always shown, hover-visible)
- [ ] Mobile cards: Replace conditional buttons with Verify + Edit + Delete (3 full-width buttons)
- [ ] Add `editTarget`, `editForm`, `isEditSubmitting` state
- [ ] Add `handleOpenEditModal`, `handleEditFormChange`, `handleEditSubmit` functions
- [ ] Add Edit Modal JSX at bottom of component
- [ ] Add `deleteTarget`, `isDeleting` state
- [ ] Add `handleDeleteMember` function
- [ ] Add Delete ConfirmModal JSX at bottom of component
- [ ] Add `import ConfirmModal from '../../../components/common/ConfirmModal'`
- [ ] Verify `PencilLine` and `Trash2` are in the lucide-react import
- [ ] Do NOT remove or modify `fetchMembers`, `handleUpdateStatus`, `handleExportCSV`, `handleOpenAddModal`, or any other existing functions
- [ ] Do NOT change the existing Add Member Modal
- [ ] Do NOT change pagination logic
- [ ] Do NOT change filter/search logic