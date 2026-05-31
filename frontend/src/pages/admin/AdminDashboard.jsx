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
  { value: 'MEMBERSHIP_DIRECTOR', label: 'Membership Director' },
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

      
      <div className="grid gap-3 lg:grid-cols-4 sm:grid-cols-2">

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
          <p className="text-xs text-slate-500 uppercase">Total Members</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{members.length}</p>
          <p className="mt-1 text-xs text-slate-500">All registered members in the system.</p>
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
          {/* Manage admin roles removed per request */}
          <h2 className="mt-2 text-2xl font-semibold text-slate-900"> </h2>

          </div>
          {!canManageRoles && (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">Read-only</span>
          )}
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
