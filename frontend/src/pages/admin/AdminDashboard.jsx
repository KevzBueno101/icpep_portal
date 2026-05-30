import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import api from '../../api/axios'
import toast from 'react-hot-toast'


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

const statusLabels = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
}

const AdminDashboard = () => {
  const { user } = useAuth()
  const [admins, setAdmins] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingAdmins, setSavingAdmins] = useState([])
  const [processingMemberId, setProcessingMemberId] = useState(null)
  const [yearEndBusy, setYearEndBusy] = useState(false)
  const [selectedRole, setSelectedRole] = useState({})
  const [selectedPosition, setSelectedPosition] = useState({})

  const [createBusy, setCreateBusy] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    username: '',
    password: '',
    position: 'NONE',
    is_delegated: false,
  })
  const [gcashNumber, setGcashNumber] = useState('')
  const [gcashName, setGcashName] = useState('')
  const [gcashSaving, setGcashSaving] = useState(false)



  const assignablePositions = useMemo(() => {
    if (!user) return []
    if (user.position === 'PRESIDENT') {
      return ['PRESIDENT', 'TREASURER', 'SECRETARY', 'NONE']
    }
    if (user.position === 'SECRETARY' && user.is_delegated) {
      return ['TREASURER', 'SECRETARY', 'NONE']
    }
    return []
  }, [user])

  const canManageRoles = !!user?.can_manage_roles
  const isPresident = user?.position === 'PRESIDENT'
  const canApproveMembers = user?.position === 'PRESIDENT' || user?.position === 'SECRETARY'

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const settingsRes = await api.get('/members/payment-settings/')
        setGcashNumber(settingsRes.data.gcash_number || '')
        setGcashName(settingsRes.data.gcash_name || '')

        if (canManageRoles) {
          const adminsRes = await api.get('/users/admins/')
          setAdmins(adminsRes.data)
        } else {
          setAdmins([])
        }

        if (canApproveMembers) {
          const membersRes = await api.get('/members/')
          setMembers(membersRes.data)
        } else {
          setMembers([])
        }
      } catch (err) {
        toast.error('Unable to load admin dashboard data.')
        setGcashNumber('')
        setGcashName('')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [canApproveMembers, canManageRoles, user])

  const pendingMembers = members.filter((member) => member.membership_status === 'PENDING')


  const totalAdmins = admins.length
  const totalPending = pendingMembers.length

  const handleRoleChange = (id, value) => {
    setSelectedRole((prev) => ({ ...prev, [id]: value }))
  }

  const handlePositionChange = (id, value) => {
    setSelectedPosition((prev) => ({ ...prev, [id]: value }))
  }

  const handleSaveAdmin = async (admin) => {
    const adminId = admin.id
    const role = selectedRole[adminId] ?? admin.role
    const position = selectedPosition[adminId] ?? admin.position
    const payload = {
      role,
      position,
      is_delegated: admin.position === 'SECRETARY' ? admin.is_delegated : false,
    }

    setSavingAdmins((prev) => [...prev, adminId])
    try {
      const res = await api.patch(`/users/admins/${adminId}/assign-role/`, payload)
      setAdmins((prev) => prev.map((item) => (item.id === adminId ? res.data.user : item)))
      toast.success('Admin role updated.')
      setSelectedRole((prev) => {
        const copy = { ...prev }
        delete copy[adminId]
        return copy
      })
      setSelectedPosition((prev) => {
        const copy = { ...prev }
        delete copy[adminId]
        return copy
      })
    } catch (err) {
      const errorText = err.response?.data?.detail || 'Unable to update admin account.'
      toast.error(errorText)
    } finally {
      setSavingAdmins((prev) => prev.filter((id) => id !== adminId))
    }
  }

  const handleToggleDelegate = async (admin) => {
    const adminId = admin.id
    setSavingAdmins((prev) => [...prev, adminId])
    try {
      const res = await api.patch(`/users/admins/${adminId}/delegate/`, {
        is_delegated: !admin.is_delegated,
      })
      setAdmins((prev) => prev.map((item) => (item.id === adminId ? res.data.user : item)))
      toast.success(`Secretary ${res.data.user.is_delegated ? 'delegated' : 'delegation removed'}.`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to toggle delegation.')
    } finally {
      setSavingAdmins((prev) => prev.filter((id) => id !== adminId))
    }
  }

  const handleYearEndReset = async () => {
    setYearEndBusy(true)
    try {
      const res = await api.post('/users/admins/year-end-reset/')
      toast.success(res.data.message || 'Year-end reset complete.')
      const adminsRes = await api.get('/users/admins/')
      setAdmins(adminsRes.data)
      if (canApproveMembers) {
        const membersRes = await api.get('/members/')
        setMembers(membersRes.data)
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Year-end reset failed.')
    } finally {
      setYearEndBusy(false)
    }
  }

  const handleMemberDecision = async (memberId, decision) => {
    setProcessingMemberId(memberId)
    try {
      const res = await api.post(`/members/${memberId}/approve/`, {
        membership_status: decision,
      })
      setMembers((prev) => prev.map((item) => (item.id === memberId ? res.data : item)))
      toast.success(`Member ${decision.toLowerCase()} successfully.`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to update member status.')
    } finally {
      setProcessingMemberId(null)
    }
  }

  const handleSaveGcashSettings = async () => {
    setGcashSaving(true)
    try {
      const payload = { gcash_number: gcashNumber, gcash_name: gcashName }
      const res = await api.patch('/members/payment-settings/', payload)
      setGcashNumber(res.data.gcash_number || '')
      setGcashName(res.data.gcash_name || '')
      toast.success('GCash settings updated.')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to save GCash settings.')
    } finally {
      setGcashSaving(false)
    }
  }


  const handleCreateOfficer = async (e) => {
    e.preventDefault()
    setCreateBusy(true)

    try {
      const payload = {
        email: createForm.email,
        username: createForm.username,
        password: createForm.password,
        role: 'ADMIN',
        position: createForm.position,
        is_delegated: createForm.position === 'SECRETARY' ? createForm.is_delegated : false,
      }

      await api.post('/users/admins/create/', payload)
      toast.success('Officer account created.')

      // reset form
      setCreateForm({
        email: '',
        username: '',
        password: '',
        position: 'NONE',
        is_delegated: false,
      })

      // refresh admins list
      const adminsRes = await api.get('/users/admins/')
      setAdmins(adminsRes.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to create officer account.')
    } finally {
      setCreateBusy(false)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="mb-8 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin Dashboard</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back, {user.position}</h1>
          <p className="mt-2 text-sm text-slate-600">Manage admin accounts and member approvals from one place.</p>
        </div>
        <div className="flex flex-wrap gap-3" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Payment Settings</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Current GCash number</h2>
          </div>
          <button
            type="button"
            disabled={gcashSaving || !(user.position === 'PRESIDENT' || user.position === 'TREASURER')}
            onClick={handleSaveGcashSettings}
            className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {gcashSaving ? 'Saving...' : 'Save GCash'}
          </button>
        </div>
        <label className="mt-5 block text-sm font-semibold text-slate-700">GCash Number</label>
        <input
          value={gcashNumber}
          onChange={(e) => setGcashNumber(e.target.value)}
          placeholder="09XXXXXXXXX"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          disabled={!(user.position === 'PRESIDENT' || user.position === 'TREASURER')}
        />

        <label className="mt-5 block text-sm font-semibold text-slate-700">GCash Name</label>
        <input
          value={gcashName}
          onChange={(e) => setGcashName(e.target.value)}
          placeholder="GCash account name"
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900"
          disabled={!(user.position === 'PRESIDENT' || user.position === 'TREASURER')}
        />

        <p className="mt-3 text-sm text-slate-500">This GCash details are displayed to registrants in the payment instructions when they choose GCash.</p>

      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase">Admin accounts</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalAdmins}</p>
          <p className="mt-1 text-xs text-slate-500">Total admin users in the system.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase">Pending approvals</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalPending}</p>
          <p className="mt-1 text-xs text-slate-500">Members awaiting approval.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase">Your role</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{user.position}</p>
          <p className="mt-1 text-xs text-slate-500">{canManageRoles ? 'You can manage admin roles.' : 'You have view-only access.'}</p>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin Accounts</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Manage admin roles</h2>
          </div>
          {!canManageRoles && (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">Read-only</span>
          )}
        </div>

        {isPresident && (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Create Officer Account</p>
              <h3 className="mt-2 text-xl font-semibold text-slate-900">Add a new admin officer</h3>
              <p className="mt-1 text-sm text-slate-600">President only.</p>
            </div>

            <form onSubmit={handleCreateOfficer} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">Email</span>
                <input
                  value={createForm.email}
                  onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                  type="email"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">Username</span>
                <input
                  value={createForm.username}
                  onChange={(e) => setCreateForm((p) => ({ ...p, username: e.target.value }))}
                  type="text"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                />
              </label>

              <label className="flex flex-col gap-2 sm:col-span-2">
                <span className="text-sm font-semibold text-slate-700">Temporary Password</span>
                <input
                  value={createForm.password}
                  onChange={(e) => setCreateForm((p) => ({ ...p, password: e.target.value }))}
                  type="password"
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                />
                <span className="text-xs text-slate-500">Min 8 characters.</span>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">Position</span>
                <select
                  value={createForm.position}
                  onChange={(e) => setCreateForm((p) => ({ ...p, position: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                >
                  {POSITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-slate-700">Delegated (Secretary only)</span>
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
                  <input
                    type="checkbox"
                    checked={createForm.is_delegated}
                    onChange={(e) => setCreateForm((p) => ({ ...p, is_delegated: e.target.checked }))}
                    disabled={createForm.position !== 'SECRETARY'}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-700">{createForm.position === 'SECRETARY' ? 'Enabled' : 'Disabled'}</span>
                </label>
              </label>

              <div className="sm:col-span-2 flex flex-wrap items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCreateForm({ email: '', username: '', password: '', position: 'NONE', is_delegated: false })}
                  className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  disabled={createBusy}
                >
                  Clear
                </button>
                <button
                  type="submit"
                  disabled={createBusy || !createForm.email || !createForm.username || !createForm.password}
                  className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {createBusy ? 'Creating...' : 'Create Officer'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Email</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Position</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Role</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="px-5 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {admins.map((admin) => {
                const isSaving = savingAdmins.includes(admin.id)
                const roleValue = selectedRole[admin.id] ?? admin.role
                const positionValue = selectedPosition[admin.id] ?? admin.position
                const canEdit = canManageRoles && assignablePositions.length > 0

                return (
                  <tr key={admin.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 align-top">
                      <p className="text-sm font-medium text-slate-900">{admin.email}</p>
                      <p className="mt-1 text-xs text-slate-500">{admin.username}</p>
                    </td>
                    <td className="px-5 py-4 align-top space-y-2">
                      {canEdit ? (
                        <select
                          value={positionValue}
                          onChange={(e) => handlePositionChange(admin.id, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                        >
                          {assignablePositions.map((position) => (
                            <option key={position} value={position}>{position}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{admin.position}</span>
                      )}
                      <p className="text-xs text-slate-500">Term: {admin.term_start || 'None'}</p>
                    </td>
                    <td className="px-5 py-4 align-top">
                      {canEdit ? (
                        <select
                          value={roleValue}
                          onChange={(e) => handleRoleChange(admin.id, e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900"
                        >
                          {ROLE_OPTIONS.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{admin.role}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 align-top space-y-2">
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{admin.is_term_active ? 'Active' : 'Expired'}</span>
                      {admin.is_delegated && (
                        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">Delegated</span>
                      )}
                      <p className="text-xs text-slate-500">{admin.can_manage_roles ? 'Can assign roles' : 'Limited'}</p>
                    </td>
                    <td className="px-5 py-4 align-top space-y-2">
                      {canEdit ? (
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => handleSaveAdmin(admin)}
                            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isSaving ? 'Saving...' : 'Save'}
                          </button>
                          {isPresident && admin.position === 'SECRETARY' && (
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={() => handleToggleDelegate(admin)}
                              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {admin.is_delegated ? 'Remove delegation' : 'Delegate'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">No actions available</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Member Approvals</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Pending member requests</h2>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {pendingMembers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
              No pending member approvals at the moment.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingMembers.map((member) => (
                <div key={member.id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{member.first_name} {member.last_name}</p>
                    <p className="text-sm text-slate-500">{member.user_email}</p>
                    <p className="mt-1 text-xs text-slate-500">{member.course} · Year {member.year_level} · {member.section}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">{statusLabels[member.membership_status]}</span>
                    <button
                      type="button"
                      disabled={processingMemberId === member.id}
                      onClick={() => handleMemberDecision(member.id, 'APPROVED')}
                      className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={processingMemberId === member.id}
                      onClick={() => handleMemberDecision(member.id, 'REJECTED')}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
