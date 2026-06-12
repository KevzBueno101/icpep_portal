import { useEffect, useMemo, useRef, useState } from 'react'
import { useOfficers } from '../../context/OfficersContext'
import OfficerCard from '../../components/OfficerCard'

export default function OfficersRoster() {
  let officers = []
  let officersLoading = false

  try {
    const value = useOfficers()
    officers = value.officers || []
    officersLoading = !!value.officersLoading
  } catch (e) {
    console.error('[OfficersRoster] OfficersContext unavailable:', e)
  }

  const scrollContainerRef = useRef(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Check for reduced motion preference
  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mql) return

    const apply = () => setReducedMotion(!!mql.matches)
    apply()

    if (mql.addEventListener) {
      mql.addEventListener('change', apply)
      return () => mql.removeEventListener('change', apply)
    }

    mql.addListener(apply)
    return () => mql.removeListener(apply)
  }, [])

  // Duplicate officers multiple times for seamless infinite scroll
  const duplicatedOfficers = useMemo(() => {
    if (officers.length === 0) return []
    // Duplicate 4 times to ensure smooth looping
    return [...officers, ...officers, ...officers, ...officers]
  }, [officers])

  return (
    <section id="officers" className="bg-white py-16 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
            Leadership Team
          </p>
          <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
            Meet Our Officers
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Meet the dedicated officers leading our community forward.
          </p>
        </div>

        {officersLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-sky-600 mb-2" />
            <p className="text-sm font-medium">Loading officers...</p>
          </div>
        ) : officers.length > 0 ? (
          <>
            {/* Mobile Grid Layout - 2 columns */}
            <div className="grid grid-cols-2 gap-4 sm:hidden">
              {officers.map((officer, index) => (
                <div key={officer.user_id ?? index}>
                  <OfficerCard officer={officer} />
                </div>
              ))}
            </div>

            {/* Desktop/Tablet Carousel */}
            <div className="hidden sm:block">
              {/* Scroll Container */}
              <div className="flex items-center overflow-hidden">
                <div
                  ref={scrollContainerRef}
                  className={`flex items-center gap-6 ${reducedMotion ? '' : 'animate-[scroll-marquee_30s_linear_infinite]'}`}
                >
                  {duplicatedOfficers.map((officer, index) => (
                    <div
                      key={`${officer.user_id ?? index}-${index}`}
                      className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4 max-w-xs"
                    >
                      <OfficerCard officer={officer} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-sm text-slate-500">
            No officers available at the moment.
          </div>
        )}
      </div>

      <style>{`
        @keyframes scroll-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  )
}
