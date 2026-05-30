import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../../context/useAuth'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../../../components/common/ConfirmModal'

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'MEMBER', label: 'Member' },
]

const POSITION_OPTIONS = [
  { value: 'NONE', label: 'None' },
  { value: 'PRESIDENT', label: 'President' },
  { value: 'TREASURER', label: 'Treasurer' },
  { value: 'SECRETARY', label: 'Secretary' },
]

const STATUS_LABELS = {
  true: 'Active',
  false: 'Inactive',
}

const AdminAdmins = () => {
  const { user } = useAuth()
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
    role: 'ADMIN',
    position: 'NONE',
    is_delegated: false,
    is_active: true,
  })

  const canEdit = useMemo(() => user?.can_manage_roles, [user])

  useEffect(() => {
    const loadAdmins = async () => {
      setLoading(true)
      try {
        const res = await api.get('/users/admins/')
        setAdmins(res.data)
      } catch (err) {
        toast.error('Unable to load admin accounts.')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadAdmins()
    }
  }, [user])

  const resetForm = () => {
    setForm({
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'ADMIN',
      position: 'NONE',
      is_delegated: false,
      is_active: true,
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
      role: admin.role || 'ADMIN',
      position: admin.position || 'NONE',
      is_delegated: admin.is_delegated || false,
      is_active: admin.is_active ?? true,
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
      toast.error('Password is required for new admin accounts.')
      return false
    }
    if (form.password && form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.')
      return false
    }
    if (form.role === 'MEMBER' && form.position !== 'NONE') {
      toast.error('Members must have position set to None.')
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
        is_delegated: form.position === 'SECRETARY' ? form.is_delegated : false,
        is_active: form.is_active,
      }

      if (form.password) {
        payload.password = form.password
      }

      let res
      if (editAdmin) {
        res = await api.patch(`/users/admins/${editAdmin.id}/`, payload)
        setAdmins((prev) => prev.map((item) => (item.id === editAdmin.id ? res.data.user : item)))
        toast.success('Admin account updated.')
      } else {
        res = await api.post('/users/admins/', payload)
        setAdmins((prev) => [res.data.user, ...prev])
        toast.success('Admin account created.')
      }

      setModalOpen(false)
      resetForm()
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data || 'Unable to save admin account.'
      toast.error(typeof message === 'string' ? message : 'Unable to save admin account.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteAdmin) return

    setDeleteBusy(true)
    try {
      await api.delete(`/users/admins/${deleteAdmin.id}/`)
      setAdmins((prev) => prev.filter((item) => item.id !== deleteAdmin.id))
      toast.success('Admin account deleted.')
      setDeleteAdmin(null)
    } catch (error) {
      const message = error.response?.data?.detail || 'Unable to delete admin account.'
      toast.error(message)
    } finally {
      setDeleteBusy(false)
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
              Manage administrator accounts, roles, and status from one place. Use the table below to update or remove admin accounts safely.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-600/20 transition hover:bg-sky-700"
          >
            Add Admin
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Total admin accounts</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{admins.length}</p>
          </div>
          <div className="text-sm text-slate-600">
            {canEdit ? 'You can create, update, and delete admin accounts.' : 'You can view admin accounts only.'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="hidden min-w-full divide-y divide-slate-200 text-left md:table">
            <thead className="bg-slate-50 text-slate-500 hidden md:table-header-group">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em]">Name</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em]">Email</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em]">Role</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em]">Position</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em]">Created</th>
                <th className="px-6 py-4 text-sm font-semibold uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white md:table-row-group">
              {loading ? (
                <tr className="md:table-row">
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 md:table-cell">
                    Loading admin accounts...
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr className="md:table-row">
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 md:table-cell">
                    No admin accounts found.
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="md:table-row hover:bg-slate-50">
                    <td className="px-6 py-4 align-top md:table-cell">
                      <div className="text-sm font-semibold text-slate-900">{admin.username}</div>
                      <div className="mt-1 text-sm text-slate-500">ID: {admin.id}</div>
                    </td>
                    <td className="px-6 py-4 align-top md:table-cell">
                      <div className="text-sm text-slate-900">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 align-top md:table-cell">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top md:table-cell">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                        {admin.position}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top md:table-cell">
                      <span className={
                        `inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                          admin.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`
                      }>
                        {STATUS_LABELS[admin.is_active]}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-top md:table-cell">
                      <div className="text-sm text-slate-600">
                        {new Date(admin.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top md:table-cell">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(admin)}
                          className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteAdmin(admin)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="md:hidden space-y-4 px-4 pb-6 pt-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 p-6 text-center text-slate-500">
              Loading admin accounts...
            </div>
          ) : admins.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 p-6 text-center text-slate-500">
              No admin accounts found.
            </div>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{admin.username}</p>
                    <p className="text-sm text-slate-500">{admin.email}</p>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{admin.position}</div>
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                    <span>Role</span>
                    <span>{admin.role}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                    <span>Status</span>
                    <span>{STATUS_LABELS[admin.is_active]}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white px-3 py-2">
                    <span>Joined</span>
                    <span>{new Date(admin.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(admin)}
                    className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteAdmin(admin)}
                    className="flex-1 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
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
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{editAdmin ? 'Edit admin' : 'New admin'}</p>
                  <h2 className="text-xl font-semibold text-slate-900">{editAdmin ? 'Update account details' : 'Create admin account'}</h2>
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

            <div className="space-y-6 px-6 py-6">
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
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
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
                  <select
                    value={form.position}
                    onChange={(e) => handleFormChange('position', e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500"
                  >
                    {POSITION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
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

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_delegated}
                    disabled={form.position !== 'SECRETARY'}
                    onChange={(e) => handleFormChange('is_delegated', e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span>Secretary delegation</span>
                </label>

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

            <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-6 py-5 sm:flex-row sm:justify-end">
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


