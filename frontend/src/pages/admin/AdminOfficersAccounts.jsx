import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { useOfficers } from '../../context/OfficersContext'

import api, { publicApi } from '../../api/axios'
import toast from 'react-hot-toast'

import OfficerCard from '../../components/OfficerCard'
import { resolveProfilePictureUrl } from '../../utils/profilePicture'

import ConfirmModal from '../../components/common/ConfirmModal'

import { User, Plus } from 'lucide-react'

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

const ROLE_OPTIONS = [
  { value: 'OFFICER', label: 'Officer' },
  // NOTE: backend uses role='ADMIN' for officer accounts in your current setup.
  // This dropdown is UI-only; it is kept conservative to avoid breaking changes.
]

const AdminOfficersAccounts = () => {
  const { user } = useAuth()
  const { refreshOfficers } = useOfficers()

  const [loading, setLoading] = useState(true)
  const [officers, setOfficers] = useState([])

  const [deleteOfficer, setDeleteOfficer] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // CRUD modal (re-uses the same approach as AdminAdmins page, but displays Officers only)
  const [modalOpen, setModalOpen] = useState(false)
  const [editAdmin, setEditAdmin] = useState(null)

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

  const [saving, setSaving] = useState(false)

  const canEdit = useMemo(() => user?.can_manage_roles, [user])

  // Officers roster from the public endpoint - same data source as Leadership Board
  const officerRoster = useMemo(() => {
    const list = Array.isArray(officers) ? officers : []

    // Backend already filters by position and role, so we just map the data
    return list.map((o) => ({
      id: o.id,
      fullName: o.fullName || o.username || '—',
      position: o.position,
      office: o.office || '',
      academicYear: o.academicYear || '',
      username: o.username,
      avatarUrl: o.avatarUrl,
      isActive: o.isActive !== false,
    }))
  }, [officers])


  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await publicApi.get('/users/officers/roster/')
        setOfficers(res.data.results || [])
      } catch (err) {
        toast.error('Unable to load officer accounts.')
        setOfficers([])
      } finally {
        setLoading(false)
      }
    }

    if (user) load()
  }, [user])

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
    if (!canEdit) return
    resetForm()
    setModalOpen(true)
  }

  const openEditModal = async (officer) => {
    if (!canEdit) return
    try {
      // Fetch full admin details directly by ID
      const res = await api.get(`/users/admins/${officer.id}/`)
      const admin = res.data
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
    } catch (err) {
      toast.error('Unable to load officer details.')
    }
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
      // Important: do not change backend expectations.
      // In your current AdminAdmins implementation, officer accounts are created via /users/admins/ and use role='OFFICER' in UI,
      // but backend roster expects leadership via position.
      // We keep role + payload shape consistent.
      const payload = {
        email: form.email,
        username: form.username,
        role: form.role,
        position: form.position,
        is_delegated: Boolean(form.is_delegated),
        is_active: Boolean(form.is_active),
      }

      if (form.password) payload.password = form.password
      if (form.year_level) payload.year_level = form.year_level
      if (form.department) payload.department = form.department
      if (form.academic_year) payload.academic_year = form.academic_year

      let res
      if (editAdmin) {
        if (form.profile_picture) {
          const formDataPayload = new FormData()
          Object.keys(payload).forEach((key) => formDataPayload.append(key, payload[key]))
          formDataPayload.append('profile_picture', form.profile_picture)

          res = await api.patch(`/users/admins/${editAdmin.id}/`, formDataPayload, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        } else {
          res = await api.patch(`/users/admins/${editAdmin.id}/`, payload)
        }
      } else {
        // create
        res = await api.post('/users/admins/', payload)
      }

      // refresh
      refreshOfficers()
      const resOfficers = await publicApi.get('/users/officers/roster/')
      setOfficers(resOfficers.data.results || [])

      setModalOpen(false)
      resetForm()
      toast.success(editAdmin ? 'Officer account updated.' : 'Officer account created.')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Unable to save officer account.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteOfficer) return

    setDeleteBusy(true)
    try {
      await api.delete(`/users/admins/${deleteOfficer.id}/`)
      refreshOfficers()
      const resOfficers = await publicApi.get('/users/officers/roster/')
      setOfficers(resOfficers.data.results || [])
      setDeleteOfficer(null)
      toast.success('Officer account deleted.')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'Unable to delete officer account.')
    } finally {
      setDeleteBusy(false)
    }
  }

  const skeletons = [...Array(8)].map((_, i) => (
    <div
      key={i}
      className="animate-pulse rounded-lg border border-slate-200 bg-slate-50 overflow-hidden"
    >
      <div className="h-56 w-full bg-slate-200" />
      <div className="p-6">
        <div className="h-5 bg-slate-200 rounded w-3/4" />
        <div className="mt-2 h-4 bg-slate-200 rounded w-1/2" />
        <div className="mt-2 h-3 bg-slate-200 rounded w-2/3" />
      </div>
    </div>
  ))

  if (loading) {
    return (
      <div className="min-h-[260px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Admin</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Officers Roster (Accounts)</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Officers are displayed here. Only admins can create/update/delete accounts.
            </p>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
            >
              + Add Officer
            </button>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="text-sm text-slate-500">Total officers</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{officerRoster.length}</p>
            </div>
            <div className="text-sm text-slate-600">
              {canEdit ? 'You can manage officer accounts.' : 'You can view officer accounts only.'}
            </div>
          </div>
        </div>

        <div className="p-6">
          {officerRoster.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
              No officer accounts found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {officerRoster.map((o) => (
                <OfficerCard
                  key={o.id}
                  officer={o}
                  canEdit={canEdit}
                  onEdit={() => openEditModal(o)}
                  onDelete={() => setDeleteOfficer(o)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteOfficer)}
        title="Delete officer account?"
        description={`Delete ${deleteOfficer?.fullName || 'this account'} permanently?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="caution"
        busy={deleteBusy}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOfficer(null)}
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
                    onChange={(e) => handleFormChange('profile_picture', e.target.files?.[0] || null)}
                    className="flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
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
                  <span>Position</span>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => handleFormChange('position', e.target.value)}
                    placeholder="e.g., President, Secretary, Treasurer"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                  />
                </label>
                <label className="space-y-2 text-sm text-slate-700">
                  <span>Year Level</span>
                  <select
                    value={form.year_level}
                    onChange={(e) => handleFormChange('year_level', e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 max-h-32 overflow-y-auto"
                  >
                    <option value="">Select year level</option>
                    {YEAR_LEVEL_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
              </div>

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
                {saving ? 'Saving…' : editAdmin ? 'Save changes' : 'Create officer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOfficersAccounts

