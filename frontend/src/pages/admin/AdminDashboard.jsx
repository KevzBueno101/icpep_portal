import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { EVENTS } from '../../utils/events'
import Skeleton from '../../components/Skeleton'
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, UserCheck, UserX, Clock, Shield, TrendingUp } from 'lucide-react'
import OfficersCarousel from '../../components/OfficersCarousel'















const COLORS = {

  APPROVED: '#22c55e',
  PENDING: '#f59e0b',
  REJECTED: '#ef4444',
  EXPIRED: '#6b7280',
}


const AdminDashboard = () => {
  const { user } = useAuth()
  const [admins, setAdmins] = useState([])
  const [memberStats, setMemberStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingAdmins, setSavingAdmins] = useState([])
  const [selectedRole, setSelectedRole] = useState({})
  const [selectedPosition, setSelectedPosition] = useState({})

  const [createBusy, setCreateBusy] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    username: '',
    password: '',
    position: 'NONE',
    department: '',
    academic_year: '',
  })
  const [gcashNumber, setGcashNumber] = useState('')
  const [gcashName, setGcashName] = useState('')
  const [gcashSaving, setGcashSaving] = useState(false)



  const assignablePositions = useMemo(() => {
    if (!user) return []
    if (user.position === 'PRESIDENT') {
      return ['PRESIDENT', 'TREASURER', 'SECRETARY', 'NONE']
    }
    return []
  }, [user])

  const canManageRoles = !!user?.can_manage_roles

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

        const statsRes = await api.get('/members/stats/')
        setMemberStats(statsRes.data || null)
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
  }, [canManageRoles, user])

  const statusCounts = memberStats?.status_counts || {}
  const totalAdmins = (admins || []).length
  const totalPending = statusCounts.PENDING ?? 0
  const totalApproved = statusCounts.APPROVED ?? 0
  const totalRejected = statusCounts.REJECTED ?? 0
  const totalExpired = statusCounts.EXPIRED ?? 0
  const totalMembers = memberStats?.total ?? 0

  const formatMonthLabel = (monthKey) => {
    const [year, month] = String(monthKey || '').split('-').map(Number)
    if (!year || !month) return monthKey
    const d = new Date(year, month - 1, 1)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  // Monthly growth is computed server-side, chronologically sorted and zero-filled.
  const memberGrowth = (memberStats?.monthly_growth || []).map((row) => ({
    ...row,
    label: formatMonthLabel(row.month),
  }))

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
      // Refresh leadership board across all pages
      window.dispatchEvent(new Event('officers-refresh'))
    } catch (err) {
      const errorText = err.response?.data?.detail || 'Unable to update admin account.'
      toast.error(errorText)
    } finally {
      setSavingAdmins((prev) => prev.filter((id) => id !== adminId))
    }
  }


  const handleSaveGcashSettings = async () => {
    setGcashSaving(true)
    try {
      const payload = { gcash_number: gcashNumber, gcash_name: gcashName }
      const res = await api.patch('/members/payment-settings/', payload)
      setGcashNumber(res.data.gcash_number || '')
      setGcashName(res.data.gcash_name || '')
      window.dispatchEvent(new CustomEvent(EVENTS.PAYMENT_SETTINGS_UPDATED))
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
        department: createForm.department,
        academic_year: createForm.academic_year,
      }

      await api.post('/users/admins/create/', payload)
      toast.success('Officer account created.')

      // Refresh leadership board across all pages
      window.dispatchEvent(new Event('officers-refresh'))

      // reset form
      setCreateForm({
        email: '',
        username: '',
        password: '',
        position: 'NONE',
        department: '',
        academic_year: '',
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
      <div className="space-y-6 p-6">
        <div className="grid gap-3 lg:grid-cols-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <Skeleton className="h-4 w-24 mb-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-4/6" />
        </div>
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
          <p className="mt-2 text-2xl font-semibold text-slate-900">{totalMembers}</p>
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
        {/* Membership Analytics (Executive Redesign) */}

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Membership Growth Trend</h3>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={memberGrowth} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 12 }}
                  labelStyle={{ color: '#0f172a' }}
                  formatter={(value) => [value, 'New Members']}
                />
                <Legend />

                <Line
                  type="monotone"
                  dataKey="count"
                  name="New Members"
                  stroke="#0284c7"
                  strokeWidth={3}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-3 text-xs text-slate-500">
            New member registrations per month (by sign-up date).
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-sm backdrop-blur">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Membership Status Distribution</h3>

          {(() => {
            const data = [
              { key: 'APPROVED', label: 'Approved', value: totalApproved, color: COLORS.APPROVED },
              { key: 'PENDING', label: 'Pending', value: totalPending, color: COLORS.PENDING },
              { key: 'REJECTED', label: 'Rejected', value: totalRejected, color: COLORS.REJECTED },
              { key: 'EXPIRED', label: 'Expired', value: totalExpired, color: COLORS.EXPIRED },
            ]
            const total = data.reduce((sum, d) => sum + d.value, 0)
            const safeTotal = total === 0 ? 1 : total

            if (total === 0) {
              return (
                <div className="flex h-[220px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                  <p className="text-sm text-slate-400">No membership data yet.</p>
                </div>
              )
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={data}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={55}
                        outerRadius={85}
                        stroke="none"
                      >
                        {data.map((entry) => (
                          <Cell key={entry.key} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {data.map((d) => {
                    const pct = Math.round((d.value / safeTotal) * 100)
                    return (
                      <div key={d.key} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ background: d.color }} />
                          <span className="text-sm font-semibold text-slate-700">{d.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-slate-900">{d.value}</div>
                          <div className="text-xs text-slate-500">{pct}%</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      </div>


      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">GCash Payment</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Payment Settings</h2>
          </div>
          {!canManageRoles && (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">Read-only</span>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm text-slate-600">GCash Name</label>
              <input
                value={gcashName}
                onChange={(e) => setGcashName(e.target.value)}
                disabled={!canManageRoles}
                className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                placeholder="GCash account name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm text-slate-600">GCash #</label>
              <input
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value)}
                disabled={!canManageRoles}
                className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                placeholder="09XXXXXXXXX or account number"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="text-sm text-slate-600">
              Current values:
              <span className="font-semibold ml-2 text-slate-900">{gcashName || '—'}</span>
              <span className="font-semibold ml-2 text-slate-900">{gcashNumber || '—'}</span>
            </div>

            <button
              type="button"
              onClick={handleSaveGcashSettings}
              disabled={!canManageRoles || gcashSaving}
              className="rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {gcashSaving ? 'Saving...' : 'Save GCash Settings'}
            </button>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Leadership Team</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Student Leadership Board</h2>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
          <OfficersCarousel />
        </div>


      </section>

    </div>
  )
}

export default AdminDashboard
