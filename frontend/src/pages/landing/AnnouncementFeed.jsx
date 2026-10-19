import { useEffect, useMemo, useRef, useState } from 'react'
import AnnouncementCard from '../../components/AnnouncementCard'
import NotificationToggle from '../../components/NotificationToggle'
import { publicApi } from '../../api/axios'
import { ANNOUNCEMENT_DELETED_EVENT, ANNOUNCEMENT_UPDATED_EVENT } from '../../utils/announcementEvents'
import { getNewestAnnouncementId } from '../../utils/announcementCategories'
import { EVENTS } from '../../utils/events'
import { RESOURCES } from '../../utils/realtime'
import { useRealtimeContent } from '../../context/RealtimeContext'

export default function AnnouncementFeed() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const newestIdRef = useRef(null)

  const fetchAnnouncements = async ({ announceNew = false, silent = false } = {}) => {
    if (!silent) setLoading(true)
    try {
      const res = await publicApi.get('/announcements/')
      const results = res.data.results || []
      const nextNewestId = getNewestAnnouncementId(results)
      if (
        announceNew &&
        newestIdRef.current != null &&
        nextNewestId != null &&
        nextNewestId !== newestIdRef.current
      ) {
        const newest = results.find((a) => a.id === nextNewestId)
        window.dispatchEvent(
          new CustomEvent(EVENTS.NEW_ANNOUNCEMENT, { detail: { title: newest?.title } })
        )
      }
      newestIdRef.current = nextNewestId
      setAnnouncements(results)
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
      setAnnouncements([])
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncements()

    const handleAnnouncementChange = () => {
      fetchAnnouncements()
    }

    window.addEventListener(ANNOUNCEMENT_UPDATED_EVENT, handleAnnouncementChange)
    window.addEventListener(ANNOUNCEMENT_DELETED_EVENT, handleAnnouncementChange)

    return () => {
      window.removeEventListener(ANNOUNCEMENT_UPDATED_EVENT, handleAnnouncementChange)
      window.removeEventListener(ANNOUNCEMENT_DELETED_EVENT, handleAnnouncementChange)
    }
  }, [])

  // Live updates for anonymous visitors via the shared realtime provider.
  useRealtimeContent(RESOURCES.ANNOUNCEMENTS, () => {
    fetchAnnouncements({ announceNew: true, silent: true })
  })

  const sortedAnnouncements = useMemo(
    () =>
      [...announcements].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      ),
    [announcements]
  )

  const featuredAnnouncement = sortedAnnouncements.find(a => a.pinned) || sortedAnnouncements[0]
  const recentAnnouncements = sortedAnnouncements.filter(a => a?.id !== featuredAnnouncement?.id)
  const newestId = getNewestAnnouncementId(sortedAnnouncements)

  return (
    <section id="announcements" className="relative bg-[#F5F7FA] py-12 sm:py-16 md:py-20 overflow-hidden overflow-x-hidden">
      {/* Subtle Background Enhancements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-400/10 blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 sm:mb-12 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
              Community Highlights
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
              Latest Announcements
            </h2>
            <p className="mt-2 sm:mt-4 max-w-2xl text-sm sm:text-base md:text-lg text-slate-600">
              Stay updated with the latest news, events, and opportunities from our community.
            </p>
          </div>
          <NotificationToggle className="mt-1 sm:mt-2" />
        </div>

        {loading ? (
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="h-72 sm:h-96 md:h-[460px] w-full animate-pulse rounded-2xl bg-slate-200"></div>
            </div>
            <div className="lg:col-span-6 flex flex-col gap-3 sm:gap-4">
              <div className="mb-2 h-7 w-1/3 animate-pulse rounded bg-slate-200"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 sm:h-24 w-full animate-pulse rounded-xl bg-slate-200"></div>
              ))}
            </div>
          </div>
        ) : featuredAnnouncement ? (
          <div className="grid gap-6 sm:gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6 lg:col-start-1 flex flex-col">
              <AnnouncementCard announcement={featuredAnnouncement} variant="featured" isNew={featuredAnnouncement?.id === newestId} />
            </div>

            <div className="lg:col-span-6 lg:col-start-7 flex flex-col min-w-0">
              <div className="mb-4 sm:mb-6 flex items-center justify-between shrink-0">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">Recent Updates</h3>
                {recentAnnouncements.length > 0 && (
                  <span className="text-xs font-semibold text-slate-500 bg-slate-200/60 dark:bg-slate-700 px-2.5 py-0.5 rounded-full">
                    {recentAnnouncements.length} {recentAnnouncements.length === 1 ? 'update' : 'updates'}
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="flex flex-col gap-3 sm:gap-4 max-h-[460px] sm:max-h-[520px] lg:max-h-[580px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                  {recentAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="block">
                      <AnnouncementCard announcement={announcement} variant="compact" isNew={announcement?.id === newestId} />
                    </div>
                  ))}
                  {recentAnnouncements.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-6 text-center text-sm text-slate-500 backdrop-blur-sm">
                      No other updates available.
                    </div>
                  )}
                </div>

                {/* Subtle bottom fade indicator for scrolling when the list overflows */}
                {recentAnnouncements.length > 4 && (
                  <div className="pointer-events-none absolute bottom-0 left-0 right-2 h-10 bg-gradient-to-t from-[#F5F7FA] to-transparent"></div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 sm:p-12 text-center backdrop-blur-sm">
            <p className="text-slate-500">No announcements yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}
