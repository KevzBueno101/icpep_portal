import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, LogOut, AlertCircle, RotateCcw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api/axios'
import { useAuth } from '../../context/useAuth'
import { resolveProfilePictureUrl } from '../../utils/profilePicture'


const { primary, secondary, accent } = {
  primary: '#001F4D',
  secondary: '#003C8F',
  accent: '#FFFFFF',
}


export default function AdminProfile({ onYearEndReset, yearEndBusy, isPresident }) {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const displayName = useMemo(() => {
    const first = (profile?.first_name ?? '').trim()
    const last = (profile?.last_name ?? '').trim()
    if (first || last) return `${first} ${last}`.trim()
    return profile?.username ? `@${profile.username}` : 'Unknown'
  }, [profile])

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/users/admin/profile/')
      setProfile(res.data)
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to load admin profile.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 text-amber-600">
            <AlertCircle size={18} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-900">Could not load profile</h2>
            <p className="mt-1 text-sm text-slate-600">{error}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
                onClick={fetchProfile}
              >
                Retry
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => navigate('/admin/dashboard')}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-center text-slate-600">No profile data.</p>
      </div>
    )
  }

  const positionLabel = profile.position && profile.position !== 'NONE' ? profile.position : 'No position'

  const accountBadges = [
    profile.is_superuser ? { label: 'Superuser', variant: 'red' } : null,
    profile.is_staff ? { label: 'Staff', variant: 'blue' } : null,
  ].filter(Boolean)

  return (
    <div className="mx-auto max-w-3xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-[#001F4D] to-[#003C8F]" />
          <div className="-mt-10 px-6 pb-4">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white shadow overflow-hidden">
                {profile.profile_picture ? (
                  <img
                    src={resolveProfilePictureUrl(profile.profile_picture)}
                    alt={profile.username}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-slate-700" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-bold text-accent">{displayName}</h1>
                <p className="mt-1 text-sm text-slate-100">
                  @{profile.username} • {profile.email}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                    Position: {positionLabel}
                  </span>
                  {accountBadges.map((b) => (
                    <span
                      key={b.label}
                      className={
                        b.variant === 'red'
                          ? 'rounded-full bg-red-600/90 px-3 py-1 text-xs font-semibold text-white'
                          : 'rounded-full bg-sky-600/90 px-3 py-1 text-xs font-semibold text-white'
                      }
                    >
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:p-7">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Account details</h2>
                <p className="mt-1 text-sm text-slate-600">Read-only view of your admin account.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
                  onClick={() => navigate('/admin/edit-profile')}
                >
                  Edit Profile
                </button>
                {isPresident && (
                  <button
                    type="button"
                    className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={yearEndBusy}
                    onClick={onYearEndReset}
                  >
                    <span className="inline-flex items-center gap-2">
                      <RotateCcw size={16} /> {yearEndBusy ? 'Resetting...' : 'Year-End Reset'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                  onClick={() => {
                    logout()
                    navigate('/login')
                  }}
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut size={16} /> Logout
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-2 border-l-4 border-[#001F4D] pl-3">
                <dt className="text-sm font-semibold text-slate-700">Name</dt>
                <dd className="text-slate-900">
                  {profile.first_name} {profile.last_name}
                </dd>
              </div>

              <div className="flex flex-col gap-2 border-l-4 border-[#003C8F] pl-3">
                <dt className="text-sm font-semibold text-slate-700">Username</dt>
                <dd className="text-slate-900">@{profile.username}</dd>
              </div>

              <div className="flex flex-col gap-2 border-l-4 border-slate-400 pl-3">
                <dt className="text-sm font-semibold text-slate-700">Email</dt>
                <dd className="text-slate-900">{profile.email}</dd>
              </div>

              <div className="flex flex-col gap-2 border-l-4 border-slate-400 pl-3">
                <dt className="text-sm font-semibold text-slate-700">Account ID</dt>
                <dd className="text-slate-900">{profile.id}</dd>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-900">Need changes to sensitive fields?</h3>
            <p className="mt-1 text-sm text-amber-800">
              You can update only your <span className="font-semibold">first name</span> and <span className="font-semibold">last name</span>. For changes to
              email, username, role, or position, contact the Admin team.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm font-semibold text-primary hover:underline"
              onClick={() => navigate('/admin/dashboard')}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

