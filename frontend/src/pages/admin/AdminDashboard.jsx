import { useEffect, useState } from 'react'
import { useAuth } from '../../context/useAuth'
import { useTheme } from '../../context/ThemeContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { EVENTS } from '../../utils/events'
import Skeleton from '../../components/Skeleton'
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, UserCheck, UserX, Clock, Shield, TrendingUp } from 'lucide-react'
import OfficersCarousel from '../../components/OfficersCarousel'
import { RESOURCES } from '../../utils/realtime'
import { useRealtimeContent } from '../../context/RealtimeContext'

const COLORS = {
  APPROVED: '#22c55e',
  PENDING: '#f59e0b',
  REJECTED: '#ef4444',
  EXPIRED: '#6b7280',
}

const AdminDashboard = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [admins, setAdmins] = useState([])
  const [realtimeNonce, setRealtimeNonce] = useState(0)
  const [memberStats, setMemberStats] = useState(null)
  const [adminLoginDailyRaw, setAdminLoginDailyRaw] = useState([])
  const [loading, setLoading] = useState(true)
  const [gcashNumber, setGcashNumber] = useState('')
  const [gcashName, setGcashName] = useState('')
  const [gcashSaving, setGcashSaving] = useState(false)

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

        try {
          const adminLoginRes = await api.get('/users/admin-login-stats/')
          setAdminLoginDailyRaw(adminLoginRes.data?.login_daily || [])
        } catch (e) {
          setAdminLoginDailyRaw([])
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
  }, [canManageRoles, user, realtimeNonce])

  useRealtimeContent(
    [RESOURCES.MEMBERS, RESOURCES.PAYMENT_SETTINGS, RESOURCES.ADMINS, RESOURCES.OFFICERS],
    () => setRealtimeNonce((n) => n + 1)
  )

  const statusCounts = memberStats?.status_counts || {}
  const totalAdmins = (admins || []).length
  const totalPending = statusCounts.PENDING ?? 0
  const totalApproved = statusCounts.APPROVED ?? 0
  const totalRejected = statusCounts.REJECTED ?? 0
  const totalExpired = statusCounts.EXPIRED ?? 0
  const totalMembers = memberStats?.total ?? 0

  const formatDayLabel = (dayKey) => {
    const [year, month, day] = String(dayKey || '').split('-').map(Number)
    if (!year || !month || !day) return dayKey
    const d = new Date(year, month - 1, day)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const loginDaily = (memberStats?.login_daily || []).map((row) => ({
    ...row,
    label: formatDayLabel(row.date),
  }))
  const hasLoginActivity = loginDaily.some((row) => row.count > 0)

  const adminLoginDaily = (adminLoginDailyRaw || []).map((row) => ({
    ...row,
    label: formatDayLabel(row.date),
  }))
  const hasAdminLoginActivity = adminLoginDaily.some((row) => row.count > 0)

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

  if (loading) {
    return (
      <div className="space-y-4 p-3 sm:p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-14 animate-pulse rounded-2xl bg-slate-100" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-40 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const kpiCards = [
    { icon: Clock, color: 'amber', label: 'Pending approvals', value: totalPending, sub: 'Members awaiting approval.' },
    { icon: UserCheck, color: 'green', label: 'Approved members', value: totalApproved, sub: 'Active members in the system.' },
    { icon: Shield, color: 'sky', label: 'Admin accounts', value: totalAdmins, sub: 'Total admin users in the system.' },
    { icon: Users, color: 'slate', label: 'Total Members', value: totalMembers, sub: 'All registered members in the system.' },
    { icon: UserX, color: 'red', label: 'Rejected members', value: totalRejected, sub: 'Members with rejected applications.' },
    { icon: TrendingUp, color: 'purple', label: 'Expired members', value: totalExpired, sub: 'Members with expired memberships.' },
  ]

  const colorMap = {
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    sky: 'bg-sky-100 text-sky-600',
    slate: 'bg-slate-100 text-slate-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
  }

  return (
    <div className="space-y-4 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Admin Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">Overview of your organization.</p>
        </div>
      </div>

      {/* Role banner (full width, compact) */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <Shield className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wide text-slate-500 sm:text-xs">Your role</p>
            <p className="truncate text-lg font-bold capitalize text-slate-900 sm:text-xl">{user.position}</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 sm:text-sm">{canManageRoles ? 'You can manage admin roles.' : 'You have view-only access.'}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className={`rounded-full p-1.5 ${colorMap[card.color]}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <p className="truncate text-[10px] uppercase tracking-wide text-slate-500 sm:text-[11px]">{card.label}</p>
              </div>
              <p className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl">{card.value}</p>
              <p className="mt-0.5 truncate text-[10px] text-slate-500 sm:text-[11px]">{card.sub}</p>
            </div>
          )
        })}
      </div>

      {/* Charts: 3 side-by-side on large screens */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        {/* Member logins */}
        <div className="min-w-0 rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 sm:text-base">Member Logins — Last 30 Days</h3>
          <div className="h-[220px] sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={loginDaily} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="label" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: isDark ? '#0f172a' : 'white', border: isDark ? '1px solid #334155' : '1px solid #e5e7eb', borderRadius: 10 }}
                  labelStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                  formatter={(value) => [value, 'Members Logged In']}
                />
                <Line type="monotone" dataKey="count" name="Members Logged In" stroke={isDark ? '#38bdf8' : '#0284c7'} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 sm:text-xs">
            {hasLoginActivity ? 'Distinct members who logged in per day (last 30 days).' : 'Login tracking starts from the feature launch date.'}
          </p>
        </div>

        {/* Admin logins */}
        <div className="min-w-0 rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 sm:text-base">Admin Logins — Last 30 Days</h3>
          <div className="h-[220px] sm:h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adminLoginDaily} margin={{ top: 8, right: 8, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={isDark ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="label" tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: isDark ? '#0f172a' : 'white', border: isDark ? '1px solid #334155' : '1px solid #e5e7eb', borderRadius: 10 }}
                  labelStyle={{ color: isDark ? '#f1f5f9' : '#0f172a' }}
                  formatter={(value) => [value, 'Admins Logged In']}
                />
                <Line type="monotone" dataKey="count" name="Admins Logged In" stroke={isDark ? '#c084fc' : '#7c3aed'} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] text-slate-500 sm:text-xs">
            {hasAdminLoginActivity ? 'Distinct admins who logged in per day (last 30 days).' : 'Login tracking starts from the feature launch date.'}
          </p>
        </div>

        {/* Status distribution */}
        <div className="min-w-0 rounded-2xl border border-slate-200/70 bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900 sm:text-base">Membership Status</h3>
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
              return <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50"><p className="text-xs text-slate-400">No membership data yet.</p></div>
            }
            return (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="h-[180px] w-full sm:h-[200px] sm:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={data} dataKey="value" nameKey="label" innerRadius={45} outerRadius={70} stroke="none">
                        {data.map((entry) => (<Cell key={entry.key} fill={entry.color} />))}
                      </Pie>
                      <Tooltip contentStyle={{ background: isDark ? '#0f172a' : 'white', border: isDark ? '1px solid #334155' : '1px solid #e5e7eb', borderRadius: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {data.map((d) => {
                    const pct = Math.round((d.value / safeTotal) * 100)
                    return (
                      <div key={d.key} className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} />
                          <span className="truncate text-xs font-medium text-slate-700">{d.label}</span>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-bold text-slate-900">{d.value}</span>
                          <span className="ml-1 text-[10px] text-slate-500">{pct}%</span>
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

      {/* Leadership Board (full width) */}
      <section className="space-y-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:text-xs">Leadership Team</p>
          <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Student Leadership Board</h2>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <OfficersCarousel />
        </div>
      </section>

      {/* Payment Settings (bottom, full width) */}
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 sm:text-xs">GCash Payment</p>
            <h2 className="text-base font-semibold text-slate-900 sm:text-lg">Payment Settings</h2>
          </div>
          {!canManageRoles && <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">Read-only</span>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-600">GCash Name</label>
              <input
                value={gcashName}
                onChange={(e) => setGcashName(e.target.value)}
                disabled={!canManageRoles}
                className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                placeholder="GCash account name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs text-slate-600">GCash #</label>
              <input
                value={gcashNumber}
                onChange={(e) => setGcashNumber(e.target.value)}
                disabled={!canManageRoles}
                className="w-full rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
                placeholder="09XXXXXXXXX or account number"
              />
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="truncate text-xs text-slate-600">
              Current: <span className="font-semibold text-slate-900">{gcashName || '—'}</span> <span className="font-semibold text-slate-900">{gcashNumber || '—'}</span>
            </div>
            <button
              type="button"
              onClick={handleSaveGcashSettings}
              disabled={!canManageRoles || gcashSaving}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {gcashSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
