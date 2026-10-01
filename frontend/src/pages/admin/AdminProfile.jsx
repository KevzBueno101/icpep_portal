import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Shield, Briefcase, GraduationCap, Building2, BadgeCheck, KeyRound, Edit2 } from 'lucide-react'
import useAdminProfile from '../../hooks/useAdminProfile'

const getInitials = (firstName) => {
  if (!firstName) return ''
  return String(firstName).trim().slice(0, 1).toUpperCase()
}

export default function AdminProfile() {
  const navigate = useNavigate()
  const { profile, loading, error, profilePictureUrl } = useAdminProfile()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
        Loading profile...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 text-sm">
        {error}
      </div>
    )
  }

  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'
  const avatarInitial = getInitials(profile?.first_name)

  const positionDisplay = profile?.position && profile.position !== 'NONE' ? profile.position : '—'

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <User className="h-8 w-8 text-sky-600" />
          Admin Profile
        </h1>
        <p className="mt-2 text-slate-600 text-sm md:text-base">
          Manage your admin account details, position, and profile information.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Profile Card Header Cover */}
        <div className="h-32 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative" />

        <div className="px-6 pb-8 relative">
          {/* Avatar Container */}
          <div className="relative -mt-16 mb-6 flex justify-between items-end">
            <div className="rounded-full h-28 w-28 overflow-hidden border-4 border-white bg-slate-200 shadow-md">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt={fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-sky-600 text-white text-3xl font-bold">
                  {avatarInitial}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate('/admin/officer-id')}
                className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <BadgeCheck className="h-4 w-4" />
                <span>Officer ID</span>
              </button>
              <Link
                to="/admin/edit-profile"
                className="flex items-center gap-1.5 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition shadow-sm"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>

          {/* Name and Badges */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">{fullName}</h1>
            <p className="text-sm text-slate-500 mt-1">@{profile?.username || '—'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                {profile?.role || 'ADMIN'}
              </span>
              {positionDisplay !== '—' && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {positionDisplay}
                </span>
              )}
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                profile?.access_level === 'FULL_CONTROL' ? 'bg-purple-100 text-purple-700' :
                profile?.access_level === 'MEMBERSHIP' ? 'bg-emerald-100 text-emerald-700' :
                'bg-slate-100 text-slate-500'
              }`}>
                {profile?.access_level === 'FULL_CONTROL' ? 'Full Control' :
                 profile?.access_level === 'MEMBERSHIP' ? 'Membership' :
                 'Restricted'}
              </span>
            </div>
          </div>

          {/* Form details */}
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { label: 'Email Address', value: profile?.email, icon: <Mail className="h-4 w-4" /> },
              { label: 'Username', value: profile?.username ? `@${profile.username}` : '—', icon: <User className="h-4 w-4" /> },
              { label: 'Officer ID', value: profile?.officer_id || '—', icon: <BadgeCheck className="h-4 w-4" /> },
              { label: 'Role', value: profile?.role, icon: <Shield className="h-4 w-4" /> },
              { label: 'Position', value: positionDisplay, icon: <Briefcase className="h-4 w-4" /> },
              { label: 'Access Level', value: profile?.access_level === 'FULL_CONTROL' ? 'Full Control' : profile?.access_level === 'MEMBERSHIP' ? 'Membership Access' : profile?.access_level === 'RESTRICTED' ? 'Restricted' : profile?.access_level || '—', icon: <KeyRound className="h-4 w-4" /> },
              { label: 'Department', value: profile?.department || '—', icon: <Building2 className="h-4 w-4" /> },
              { label: 'Academic Year', value: profile?.academic_year ? `AY ${profile.academic_year}` : '—', icon: <GraduationCap className="h-4 w-4" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  {icon}
                  {label}
                </label>
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 font-medium">
                  {value || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}



