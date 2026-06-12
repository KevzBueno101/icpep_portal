import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Shield, Briefcase, GraduationCap, Building2 } from 'lucide-react'
import useAdminProfile from '../../hooks/useAdminProfile'

export default function AdminProfile() {
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

  const positionDisplay = profile?.position && profile.position !== 'NONE' ? profile.position : '—'

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex items-center gap-6">
        <div className="h-20 w-20 flex-shrink-0 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 flex items-center justify-center">
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt={fullName} className="h-full w-full object-cover" />
          ) : (
            <User className="h-8 w-8 text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-slate-900 truncate">{fullName}</h1>
          <p className="text-sm text-slate-500 mt-1">@{profile?.username || '—'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
              {profile?.role || 'ADMIN'}
            </span>
            {positionDisplay !== '—' && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {positionDisplay}
              </span>
            )}
          </div>
        </div>

        <Link
          to="/admin/edit-profile"
          className="flex-shrink-0 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition"
        >
          Edit Profile
        </Link>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">Account Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Email', value: profile?.email, icon: <Mail className="h-4 w-4" /> },
            { label: 'Username', value: profile?.username ? `@${profile.username}` : '—', icon: <User className="h-4 w-4" /> },
            { label: 'Role', value: profile?.role, icon: <Shield className="h-4 w-4" /> },
            { label: 'Position', value: positionDisplay, icon: <Briefcase className="h-4 w-4" /> },
            { label: 'Department', value: profile?.department || '—', icon: <Building2 className="h-4 w-4" /> },
            { label: 'Academic Year', value: profile?.academic_year ? `AY ${profile.academic_year}` : '—', icon: <GraduationCap className="h-4 w-4" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                {icon}
                <span className="uppercase tracking-wider font-medium">{label}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">{value || '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}



