import { useEffect, useMemo, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import OfficerCard from '../OfficerCard'
import { resolveProfilePictureUrl } from '../../utils/profilePicture'

export default function AdminAccountsRoster({ title = 'Admin Accounts' }) {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setLoading(true)
      try {
        const res = await api.get('/users/admins/')
        if (!mounted) return
        setAdmins(Array.isArray(res.data?.results) ? res.data.results : [])
      } catch (err) {
        console.error('[AdminAccountsRoster] load admins failed:', err)
        toast.error('Unable to load admin accounts.')
        if (!mounted) return
        setAdmins([])
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  const roster = useMemo(() => {
    return (admins || []).map((admin) => {
      const fullName = admin?.fullName || admin?.username || admin?.email || '—'
      const position = admin?.position || '—'
      return {
        id: admin.id,
        fullName,
        position,
        office: admin?.department || '',
        academicYear: admin?.academic_year || '',
        username: admin?.username ? `@${admin.username}` : admin?.username,
        // cloudinary urls should come from backend/resolveProfilePictureUrl
        avatarUrl: admin?.profile_picture ? resolveProfilePictureUrl(admin.profile_picture) : undefined,
        isActive: admin?.is_active !== false,
      }
    })
  }, [admins])

  const filtered = roster.filter((a) => a?.position && a?.fullName)

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Admin</p>
        <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border border-slate-200 bg-slate-50 overflow-hidden"
              >
                <div className="h-56 w-full bg-slate-200" />
                <div className="p-6">
                  <div className="h-5 bg-slate-200 rounded w-3/4" />
                  <div className="mt-2 h-4 bg-slate-200 rounded w-1/2" />
                  <div className="mt-2 h-3 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            No admin accounts found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((admin) => (
              <OfficerCard key={admin.id} officer={admin} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

