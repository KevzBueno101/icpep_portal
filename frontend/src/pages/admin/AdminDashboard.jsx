import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, UserCheck, UserX, Clock, Shield, TrendingUp } from 'lucide-react'







const COLORS = {
  APPROVED: '#22c55e',
  PENDING: '#f59e0b',
  REJECTED: '#ef4444',
  EXPIRED: '#6b7280',
}

const AdminDashboard = () => {
  const { user } = useAuth()
  const [admins, setAdmins] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingAdmins, setSavingAdmins] = useState([])
  const [processingMemberId, setProcessingMemberId] = useState(null)
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
          setAdmins(adminsRes.data.results || [])
        } else {
          setAdmins([])
        }

        if (canApproveMembers) {
          const membersRes = await api.get('/members/')
          setMembers(membersRes.data.results || [])
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

  const pendingMembers = (members || []).filter((member) => member.membership_status === 'PENDING')
  const approvedMembers = (members || []).filter((member) => member.membership_status === 'APPROVED')
  const rejectedMembers = (members || []).filter((member) => member.membership_status === 'REJECTED')
  const expiredMembers = (members || []).filter((member) => member.membership_status === 'EXPIRED')


  const totalAdmins = (admins || []).length
  const totalPending = (pendingMembers || []).length
  const totalApproved = (approvedMembers || []).length
  const totalRejected = (rejectedMembers || []).length
  const totalExpired = (expiredMembers || []).length

  // Prepare data for charts
  // Membership Status Distribution has been replaced with a count-based
  // view of how many Members and Officers have been visited/registered.
  const membersVsOfficersDistribution = [
    { name: 'Members', value: (members || []).length, color: '#22c55e' },
    { name: 'Officers', value: (admins || []).length, color: '#3b82f6' },
  ].filter(item => item.value > 0)


  // Group members by month for growth chart
  const memberGrowth = useMemo(() => {
    const monthGroups = {}
    ;(members || []).forEach(member => {
      const date = new Date(member.created_at || member.updated_at)
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = { month: monthKey, approved: 0, pending: 0, rejected: 0 }
      }
      if (member.membership_status === 'APPROVED') monthGroups[monthKey].approved++
      else if (member.membership_status === 'PENDING') monthGroups[monthKey].pending++
      else if (member.membership_status === 'REJECTED') monthGroups[monthKey].rejected++
    })
    return Object.values(monthGroups).sort((a, b) => new Date(a.month) - new Date(b.month))
  }, [members])

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
      setAdmins((prev) => (prev || []).map((item) => (item.id === adminId ? res.data.user : item)))
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
      setAdmins((prev) => (prev || []).map((item) => (item.id === adminId ? res.data.user : item)))
      toast.success(`Secretary ${res.data.user.is_delegated ? 'delegated' : 'delegation removed'}.`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Unable to toggle delegation.')
    } finally {
      setSavingAdmins((prev) => prev.filter((id) => id !== adminId))
    }
  }


  const handleMemberDecision = async (memberId, decision) => {
    setProcessingMemberId(memberId)
    try {
      const res = await api.post(`/members/${memberId}/approve/`, {
        membership_status: decision,
      })
      setMembers((prev) => (prev || []).map((item) => (item.id === memberId ? res.data : item)))
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
      setAdmins(adminsRes.data.results || [])
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
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-sky-100 p-2">
              <Shield className="h-5 w-5 text-sky-600" />
            </div>
            <p className="text-xs text-slate-500 uppercase">Admin accounts</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalAdmins}</p>
          <p className="mt-1 text-xs text-slate-500">Total admin users in the system.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-2">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-xs text-slate-500 uppercase">Pending approvals</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalPending}</p>
          <p className="mt-1 text-xs text-slate-500">Members awaiting approval.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <UserCheck className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-xs text-slate-500 uppercase">Approved members</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalApproved}</p>
          <p className="mt-1 text-xs text-slate-500">Active members in the system.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-slate-100 p-2">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
            <p className="text-xs text-slate-500 uppercase">Total Members</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{(members || []).length}</p>
          <p className="mt-1 text-xs text-slate-500">All registered members in the system.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-red-100 p-2">
              <UserX className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-xs text-slate-500 uppercase">Rejected members</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalRejected}</p>
          <p className="mt-1 text-xs text-slate-500">Members with rejected applications.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-xs text-slate-500 uppercase">Expired members</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalExpired}</p>
          <p className="mt-1 text-xs text-slate-500">Members with expired memberships.</p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <Shield className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-xs text-slate-500 uppercase">Your role</p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{user.position}</p>
          <p className="mt-1 text-xs text-slate-500">{canManageRoles ? 'You can manage admin roles.' : 'You have view-only access.'}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Members vs Officers Visited</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={membersVsOfficersDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => {
                  const count = typeof value === 'number' ? value : 0
                  return `${name}: ${count}`
                }}

                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {membersVsOfficersDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Member Growth Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approved" fill={COLORS.APPROVED} name="Approved" />
              <Bar dataKey="pending" fill={COLORS.PENDING} name="Pending" />
              <Bar dataKey="rejected" fill={COLORS.REJECTED} name="Rejected" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>


      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Summary</p>
          {/* Manage admin roles removed per request */}
          <h2 className="mt-2 text-2xl font-semibold text-slate-900"> </h2>

          </div>
          {!canManageRoles && (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">Read-only</span>
          )}
        </div>


      </section>

    </div>
  )
}

export default AdminDashboard
