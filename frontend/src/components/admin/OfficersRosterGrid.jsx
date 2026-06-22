import { useMemo } from 'react'
import { useOfficers } from '../../context/OfficersContext'
import OfficerCard from '../OfficerCard'

export default function OfficersRosterGrid({ title = 'Officers Roster' }) {
  let officers = []
  let officersLoading = false
  let refreshOfficers = null

  try {
    const value = useOfficers()
    officers = value?.officers || []
    officersLoading = !!value?.officersLoading
    refreshOfficers = value?.refreshOfficers
  } catch (e) {
    console.error('[OfficersRosterGrid] OfficersContext unavailable:', e)
  }

  const validOfficers = useMemo(() => {
    return (officers || [])
      .map((officer) => ({
        ...officer,
        avatarUrl: officer?.avatarUrl,
        // normalize possible backend naming
        academicYear: officer?.academicYear ?? officer?.academic_year ?? officer?.academicYear,
      }))
      .filter(
        (o) =>
          o?.isActive !== false &&
          o?.isActive !== undefined ? true : true
      )
      .filter((o) => o?.isActive !== false)
      .filter((o) => o?.fullName && o.fullName !== '-' && o?.position)
  }, [officers])

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Admin</p>
        <h2 className="mt-2 text-xl sm:text-2xl font-semibold text-slate-900">{title}</h2>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {officersLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                // skeleton without importing OfficerSkeleton to avoid breaking styling
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
        ) : validOfficers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-slate-500">
            No officers assigned.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {validOfficers.map((officer) => (
              <OfficerCard key={officer.id} officer={officer} />
            ))}
          </div>
        )}
      </div>

      {/* keep refresh capability if needed later */}
      {refreshOfficers ? null : null}

    </section>
  )
}

