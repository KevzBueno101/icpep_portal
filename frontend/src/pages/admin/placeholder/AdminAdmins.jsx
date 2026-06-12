import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../../../components/common/ConfirmModal'
import { User, Plus } from 'lucide-react'
import { resolveProfilePictureUrl } from '../../../utils/profilePicture'

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'OFFICER', label: 'Officer' },
]


const YEAR_LEVEL_OPTIONS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
]

const STATUS_LABELS = {
  true: 'Active',
  false: 'Inactive',
}

const AdminAdmins = ({ refreshTrigger }) => {
  const { user, refreshUser } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editAdmin, setEditAdmin] = useState(null)
  const [deleteAdmin, setDeleteAdmin] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'OFFICER',
    position: '',
    is_delegated: false,
    is_active: true,
    profile_picture: null,
    year_level: '',
    department: '',
    academic_year: '',
  })

  const canEdit = useMemo(() => user?.can_manage_roles, [user])

  useEffect(() => {
    const loadAdmins = async () => {
      setLoading(true)
      try {
        const res = await api.get('/users/admins/')
        setAdmins(res.data.results || [])
      } catch (err) {
        toast.error('Unable to load admin accounts.')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadAdmins()
    }
  }, [user, refreshTrigger])

  const resetForm = () => {
    setForm({
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'OFFICER',
      position: '',
      is_delegated: false,
      is_active: true,
      profile_picture: null,
      year_level: '',
      department: '',
      academic_year: '',
    })
    setEditAdmin(null)
  }

  const openCreateModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEditModal = (admin) => {
    setEditAdmin(admin)
    setForm({
      email: admin.email || '',
      username: admin.username || '',
      password: '',
      confirmPassword: '',
      role: admin.role || 'OFFICER',
      position: admin.position || '',
      is_delegated: admin.is_delegated || false,
      is_active: admin.is_active ?? true,
      profile_picture: null,
      year_level: admin.year_level || '',
      department: admin.department || '',
      academic_year: admin.academic_year || '',
    })
    setModalOpen(true)
  }

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!form.email || !form.username) {
      toast.error('Email and username are required.')
      return false
    }
    if (!editAdmin && !form.password) {
      toast.error('Password is required for new officer accounts.')
      return false
    }
    if (form.password && form.password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return false
    }
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.')
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      const payload = {
        email: form.email,
        username: form.username,
        role: form.role,
        position: form.position,
        is_delegated: Boolean(form.is_delegated),
        is_active: Boolean(form.is_active),
      }

      if (form.password) {
        payload.password = form.password
      }

      if (form.year_level && form.year_level !== '') {
        payload.year_level = form.year_level
      }

      if (form.department) {
        payload.department = form.department
      }

      if (form.academic_year) {
        payload.academic_year = form.academic_year
      }

      let res
      if (editAdmin) {
        // Use FormData if profile picture is present
        if (form.profile_picture) {
          const formDataPayload = new FormData()
          Object.keys(payload).forEach(key => {
            formDataPayload.append(key, payload[key])
          })
          formDataPayload.append('profile_picture', form.profile_picture)
          res = await api.patch(`/users/admins/${editAdmin.id}/`, formDataPayload, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
        } else {
          res = await api.patch(`/users/admins/${editAdmin.id}/`, payload)
        }
        setAdmins((prev) => (prev || []).map((item) => (item.id === editAdmin.id ? res.data.user : item)))
        // If the updated admin is the current user, refresh the auth context to update sidebar
        if (editAdmin.id === user?.id) {
          await refreshUser()
        }
        toast.success('Officer account updated.')
      } else {
        res = await api.post('/users/admins/', payload)
        setAdmins((prev) => [res.data.user, ...(prev || [])])
        toast.success('Officer account created.')
      }

      setModalOpen(false)
      resetForm()
    } catch (error) {
      console.error('Error saving officer:', error.response?.data)
      console.error('Full error:', error)
      const message = error.response?.data?.detail || error.response?.data?.error || JSON.stringify(error.response?.data) || 'Unable to save officer account.'
      toast.error(typeof message === 'string' ? message : 'Unable to save officer account.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteAdmin) return

    setDeleteBusy(true)
    try {
      await api.delete(`/users/admins/${deleteAdmin.id}/`)
      setAdmins((prev) => (prev || []).filter((item) => item.id !== deleteAdmin.id))
      toast.success('Admin account deleted.')
      setDeleteAdmin(null)
    } catch (error) {
      const message = error.response?.data?.detail || 'Unable to delete admin account.'
      toast.error(message)
    } finally {
      setDeleteBusy(false)
    }
  }

  const formatDate = (value) => {
    try {
      if (!value) return '-'
      const d = new Date(value)
      if (isNaN(d.getTime())) return '-'
      return d.toLocaleDateString()
    } catch {
      return '-'
    }
  }


  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Admin Management</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Admin Accounts</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Manage administrator accounts, roles, and status from one place. Click on any card to edit officer details.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Total admin accounts</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{(admins || []).length}</p>
          </div>
          <div className="text-sm text-slate-600">
            {canEdit ? 'You can create, update, and delete admin accounts.' : 'You can view admin accounts only.'}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-500">
              Loading admin accounts...
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {canEdit && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex aspect-[4/3] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-sky-400 hover:bg-sky-50"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600 transition hover:bg-sky-200">
                    <Plus size={32} />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-slate-700">Add New Officer</p>
                </button>
              )}

              {(admins || []).length === 0 && !canEdit ? (
                <div className="col-span-full flex items-center justify-center py-12 text-slate-500">
                  No admin accounts found.
                </div>
              ) : (
                admins.map((admin) => (
                  <div
                    key={admin.id}
                    onClick={() => openEditModal(admin)}
                    className="group flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-sky-300 hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      {admin.profile_picture ? (
                        <img
                          src={resolveProfilePictureUrl(admin.profile_picture)}
                          alt={admin.username}
                          className="h-16 w-16 flex-shrink-0 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                      ) : (
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white border-2 border-white shadow-sm">
                          <User size={28} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{admin.username}</p>
                        <p className="text-sm text-slate-500 truncate">{admin.email}</p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                        <span className="text-xs text-slate-600">Role</span>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                          {admin.role}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                        <span className="text-xs text-slate-600">Position</span>
                        <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                          admin.position ? 'text-sky-700' : 'text-slate-500'
                        }`}>
                          {admin.position || 'No position'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                        <span className="text-xs text-slate-600">Status</span>
                        <span className={`text-xs font-semibold uppercase tracking-[0.2em] ${
                          admin.is_active ? 'text-emerald-700' : 'text-slate-600'
                        }`}>
                          {STATUS_LABELS[String(admin.is_active)] || (admin.is_active ? 'Active' : 'Inactive')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                        <span className="text-xs text-slate-600">Created</span>
                        <span className="text-xs text-slate-700">
                          {formatDate(admin.created_at)}
                        </span>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="mt-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(admin)
                          }}
                          className="flex-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteAdmin(admin)
                          }}
                          className="flex-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteAdmin)}
        title="Delete admin account?"
        description={`Delete ${deleteAdmin?.email || 'this account'} permanently?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="caution"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteAdmin(null)}
      />

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl flex flex-col">
            <div className="border-b border-slate-200 px-6 py-5 flex-shrink-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{editAdmin ? 'Edit officer' : 'New officer'}</p>
                  <h2 className="text-xl font-semibold text-slate-900">{editAdmin ? 'Update officer details' : 'Create officer account'}</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false)
                    resetForm()
                  }}
                  className="rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="space-y-6 px-6 py-6 overflow-y-auto flex-1">
              <label className="space-y-2 text-sm text-slate-700">
                <span>Profile Picture</span>
                <div className="flex items-center gap-4">
                  {editAdmin?.profile_picture && !form.profile_picture && (
                    <img
                      src={resolveProfilePictureUrl(editAdmin.profile_picture)}
                      alt="Current profile"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  )}
                  {form.profile_picture && (
                    <img
                      src={URL.createObjectURL(form.profile_picture)}
                      alt="New profile"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  )}
                  {!editAdmin?.profile_picture && !form.profile_picture && (
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white">
                      <User size={32} />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFormChange('profile_picture', e.target.files[0])}
                    className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 file:mr-4 file:rounded-full file:border-0 file:bg-sky-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-200"
                  />
                </div>
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Username</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => handleFormChange('username', e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Role</span>
                  <select
                    value={form.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 max-h-32 overflow-y-auto"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span>Position</span>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => handleFormChange('position', e.target.value)}
                    placeholder="e.g., President, Secretary, Treasurer, etc."
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Year Level</span>
                  <select
                    value={form.year_level}
                    onChange={(e) => handleFormChange('year_level', e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 max-h-32 overflow-y-auto"
                  >
                    <option value="">Select year level</option>
                    {YEAR_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span>Department</span>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => handleFormChange('department', e.target.value)}
                    placeholder="e.g., Executive Office"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Academic Year</span>
                  <input
                    type="text"
                    value={form.academic_year}
                    onChange={(e) => handleFormChange('academic_year', e.target.value)}
                    placeholder="e.g., 2025-2026"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>

                <div className="space-y-2 text-sm text-slate-700">
                  <span>Secretary delegation</span>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={form.is_delegated}
                      onChange={(e) => handleFormChange('is_delegated', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Enable delegation (only applies to Secretary positions)</span>
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Password</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    placeholder={editAdmin ? 'Leave blank to keep the same password' : ''}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-700">
                  <span>Confirm password</span>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => handleFormChange('confirmPassword', e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => handleFormChange('is_active', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Active account</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setModalOpen(false)
                  resetForm()
                }}
                className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving…' : editAdmin ? 'Save changes' : 'Create admin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAdmins


