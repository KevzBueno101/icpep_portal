import { useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useMember } from '../../context/MemberContext'
import { useOfficers } from '../../context/OfficersContext'
import { Bell, CreditCard, ArrowRight, UserCheck, Users } from 'lucide-react'



const YEAR_LABEL_BY_VALUE = {
  '1': '1st Year',
  '2': '2nd Year',
  '3': '3rd Year',
  '4': '4th Year',
}

const formatMemberSince = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function MemberDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile, paymentSettings, announcements, annLoading, paymentLoading } = useMember()
  const { officers, officersLoading } = useOfficers()


  const memberFirstName = profile?.first_name || user?.first_name || ''

  const recentAnnouncements = useMemo(() => {
    const sorted = [...announcements].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )
    return sorted.slice(0, 2)
  }, [announcements])

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 px-6 py-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Welcome, {memberFirstName}!
            </h1>
            <p className="mt-2 text-slate-300 max-w-xl text-sm md:text-base">
              You are an active student member of the Institute of Computer Engineers of the Philippines Student Edition (ICPEP.SE).
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-400">
              <UserCheck className="h-4 w-4" />
              APPROVED MEMBER
            </span>
          </div>
        </div>

        {/* Decorative glows */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Status', value: profile?.membership_status || 'APPROVED', color: 'text-emerald-600' },
          {
            label: 'Year Level',
            value: YEAR_LABEL_BY_VALUE[String(profile?.year_level ?? '')] || profile?.year_level || '—',
            color: 'text-slate-900',
          },
          { label: 'Course', value: profile?.course || '—', color: 'text-slate-900' },
          { label: 'Member Since', value: formatMemberSince(profile?.created_at), color: 'text-slate-900' },
        ].map((stat, idx) => (
          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow transition">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
            <p className={`mt-2 text-lg font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: ID Quick access & Payment info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Student Leadership Board (Officers) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <Users className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Student Leadership Board</h2>
            </div>

            {officersLoading ? (
              <div className="flex items-center justify-center py-6 text-slate-500 text-sm">
                Loading officers...
              </div>
            ) : officers?.length ? (
              <div className="grid gap-4">
                {officers.map((officer, idx) => (
                  <div
                    key={officer.user_id ?? idx}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                  >
                    {officer.profile_picture ? (
                      <img
                        src={officer.profile_picture}
                        alt={`${officer.first_name} ${officer.last_name}`}
                        className="h-10 w-10 rounded-full object-cover bg-slate-200"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-slate-700 font-bold">
                        {(officer.first_name?.[0] ?? 'O')}
                        {(officer.last_name?.[0] ?? '')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {officer.first_name || '—'} {officer.last_name || ''}
                      </div>
                      <div className="text-xs text-sky-600 font-semibold truncate">
                        {officer.position || ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No officers available.
              </div>
            )}
          </div>

          {/* Quick ID Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 mb-4">
                <CreditCard className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Digital ID Card</h2>
              <p className="mt-2 text-sm text-slate-600">
                Access your digital membership pass. Swipe, flip to scan, or download for off-line use.
              </p>
            </div>
            <Link
              to="/member/id"
              className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition shadow-sm"
            >
              <span>Open ID Card</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Payment Info */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Payment Status</h2>
              {paymentLoading && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-sky-600" />
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Method</div>
                <div className="mt-1 text-sm font-semibold text-slate-900">
                  {profile?.payment_method || '—'}
                </div>
              </div>

              {profile?.payment_method === 'GCASH' && (
                <div>
                  <div className="text-xs font-semibold uppercase text-slate-500">GCash Details</div>
                  <div className="mt-1 text-sm text-slate-950 font-medium bg-slate-50 border border-slate-100 rounded-xl p-3">
                    <div className="font-semibold">{paymentSettings?.gcash_name || '—'}</div>
                    <div className="text-slate-600">{paymentSettings?.gcash_number || '—'}</div>
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Proof of Payment</div>
                {profile?.payment_proof_image ? (
                  <div className="relative mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 group">
                    <img
                      src={profile.payment_proof_image}
                      alt="Payment proof"
                      className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <button
                      type="button"
                      onClick={() => window.open(profile.payment_proof_image, '_blank')}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 text-white text-xs font-bold"
                    >
                      View Full Image
                    </button>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No proof image uploaded.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Announcements */}
        <div className="lg:col-span-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">Recent Announcements</h2>
                </div>
                <Link
                  to="/member/announcements"
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1.5"
                >
                  <span>See all</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {annLoading && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600 mb-2" />
                  <p className="text-sm">Fetching announcements...</p>
                </div>
              )}

              {!annLoading && recentAnnouncements.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 my-4">
                  No announcements found.
                </div>
              )}

              <div className="space-y-4 my-2">
                {!annLoading &&
                  recentAnnouncements.map((ann) => (
                    <button
                      key={ann.id}
                      type="button"
                      onClick={() => navigate(`/announcement/${ann.id}`)}
                      className="w-full text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-slate-300 group flex flex-col"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100">
                          {ann.category || 'Announcement'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {ann.created_at ? new Date(ann.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-bold text-slate-900 group-hover:text-sky-600 transition">
                        {ann.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                        {ann.body}
                      </p>
                    </button>
                  ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-6">
              <p className="text-xs text-slate-500 text-center">
                Need help? Contact an administrator at <span className="font-semibold">support@icpep.se</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
