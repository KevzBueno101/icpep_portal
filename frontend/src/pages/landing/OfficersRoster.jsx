import { useEffect, useMemo, useState } from 'react'
import OfficersCoverflow from './OfficersCoverflow'
import { useOfficers } from '../../context/OfficersContext'
import { OFFICER_CATEGORIES, groupOfficersByCategory } from '../../utils/officerCategories'

const isValidOfficer = (officer) => {
  const activeOk = officer.isActive === undefined ? true : !!officer.isActive
  return activeOk && !!officer.fullName && officer.fullName !== '-' && !!officer.position
}

export default function OfficersRoster() {
  const [category, setCategory] = useState('head')
  const [error, setError] = useState(null)

  let officers = []
  let officersLoading = false
  let refreshOfficers = () => {}

  try {
    const value = useOfficers()
    officers = value.officers || []
    officersLoading = !!value.officersLoading
    refreshOfficers = value.refreshOfficers || (() => {})
  } catch (e) {
    console.error('[OfficersRoster] OfficersContext unavailable:', e)
    setError('Unable to load leadership directory. Please try again later.')
  }

  const groups = useMemo(
    () => groupOfficersByCategory(officers.filter(isValidOfficer)),
    [officers]
  )

  // If the selected category has no officers (e.g. fresh install, or all its
  // officers were deactivated), fall back to the first category that does.
  useEffect(() => {
    if (officersLoading) return
    if (groups[category]?.length) return
    const firstPopulated = OFFICER_CATEGORIES.find((c) => groups[c.key]?.length)
    if (firstPopulated && firstPopulated.key !== category) {
      setCategory(firstPopulated.key)
    }
  }, [category, groups, officersLoading])

  const activeCategory =
    OFFICER_CATEGORIES.find((c) => c.key === category) || OFFICER_CATEGORIES[0]
  const activeOfficers = groups[activeCategory.key] || []

  return (
    <section
      id="officers"
      className="bg-white py-16 border-t border-slate-100"
      aria-label="Officers Directory"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Headline / Section title (kept inside the white section) */}
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Leadership Team
          </p>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Officers Directory
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Meet the dedicated officers leading our community forward.
          </p>
        </div>

        {/* Category switcher */}
        <fieldset className="mb-8">
          <legend className="sr-only">Select leadership category</legend>
          <div className="flex flex-wrap justify-center gap-2">
            {OFFICER_CATEGORIES.map((option) => {
              const selected = option.key === activeCategory.key
              return (
                <label
                  key={option.key}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition focus-within:ring-2 focus-within:ring-sky-500 focus-within:ring-offset-2 ${
                    selected
                      ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="officer-category"
                    value={option.key}
                    checked={selected}
                    onChange={() => setCategory(option.key)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              )
            })}
          </div>
        </fieldset>

        <h3 className="mb-6 text-center text-lg font-semibold text-slate-800">
          {activeCategory.label}
        </h3>

        {error ? (
          <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-8 text-center sm:p-12">
            <p className="mb-4 text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null)
                refreshOfficers()
              }}
              className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        ) : activeOfficers.length > 0 ? (
          <OfficersCoverflow
            key={activeCategory.key}
            officers={activeOfficers}
            caption={activeCategory.label}
          />
        ) : officersLoading ? (
          <div className="flex justify-center gap-6" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-56 w-40 animate-pulse rounded-2xl bg-slate-100 sm:w-48"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center sm:p-12">
            <h3 className="mb-2 text-lg font-semibold text-slate-900">
              No Officers Assigned
            </h3>
            <p className="text-sm text-slate-500">
              No officers have been assigned to {activeCategory.label} yet. Check
              back later for leadership updates.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
