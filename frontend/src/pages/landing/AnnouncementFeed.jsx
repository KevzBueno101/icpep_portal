import { useEffect, useMemo, useState } from 'react'
import AnnouncementCard from '../../components/AnnouncementCard'
import { publicApi } from '../../api/axios'

export default function AnnouncementFeed() {
  const [announcements, setAnnouncements] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true)
      try {
        const res = await publicApi.get('/announcements/')
        setAnnouncements(res.data)
        setActiveIndex(0)
      } catch (err) {
        console.error('Failed to fetch announcements:', err)
        setAnnouncements([])
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const sortedAnnouncements = useMemo(
    () =>
      [...announcements].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      ),
    [announcements]
  )

  const activeAnnouncement = sortedAnnouncements[activeIndex]
  const hasMultiple = sortedAnnouncements.length > 1
  const visibleAnnouncements = activeAnnouncement
    ? [
        activeAnnouncement,
        ...(hasMultiple
          ? [sortedAnnouncements[(activeIndex + 1) % sortedAnnouncements.length]]
          : []),
      ]
    : []

  const goPrevious = () => {
    if (!hasMultiple) return
    setActiveIndex((current) =>
      current === 0 ? sortedAnnouncements.length - 1 : current - 1
    )
  }

  const goNext = () => {
    if (!hasMultiple) return
    setActiveIndex((current) =>
      current === sortedAnnouncements.length - 1 ? 0 : current + 1
    )
  }

  return (
    <section id="announcements" className="bg-slate-50 py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-5 text-center sm:flex-row sm:items-end sm:justify-between sm:text-left">
          <div>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-sky-700">
              Community Highlights
            </p>
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Latest Announcements
            </h2>
            <p className="mt-4 max-w-2xl text-slate-600">
              Stay updated with the latest news, events, and opportunities from our community.
            </p>
          </div>

            <div className="flex items-center justify-center gap-3">

            
            <button
              type="button"
              onClick={goPrevious}
              disabled={!hasMultiple}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous announcement"
            >
              &lt;
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!hasMultiple}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next announcement"
            >
              &gt;
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
            Loading announcements...
          </div>
        ) : activeAnnouncement ? (
          <div className="space-y-4">
            <div className="grid gap-6 md:grid-cols-2">
              {visibleAnnouncements.map((announcement, index) => (
                <div
                  key={`${announcement.id}-${index}`}
                  className={index > 0 ? 'hidden md:block' : ''}
                >
                  <AnnouncementCard announcement={announcement} />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              {sortedAnnouncements.map((announcement, index) => (
                <button
                  key={announcement.id}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  className={`h-2.5 rounded-full transition-all ${
                    index === activeIndex ? 'w-8 bg-sky-600' : 'w-2.5 bg-slate-300'
                  }`}
                  aria-label={`Show announcement ${index + 1}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            No announcements yet.
          </div>
        )}
      </div>
    </section>
  )
}
