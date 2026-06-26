import { useEffect, useMemo, useState } from 'react'
import AnnouncementCard from '../../components/AnnouncementCard'
import { publicApi } from '../../api/axios'
import { ANNOUNCEMENT_DELETED_EVENT, ANNOUNCEMENT_UPDATED_EVENT } from '../../utils/announcementEvents'

export default function AnnouncementFeed() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await publicApi.get('/announcements/')
      setAnnouncements(res.data.results)
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
      setAnnouncements([])
    } finally {
      setLoading(false)
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

  const sortedAnnouncements = useMemo(
    () =>
      [...announcements].sort(
        (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
      ),
    [announcements]
  )

  const featuredAnnouncement = sortedAnnouncements.find(a => a.pinned) || sortedAnnouncements[0]
  const recentAnnouncements = sortedAnnouncements.filter(a => a?.id !== featuredAnnouncement?.id)

  return (
    <section id="announcements" className="relative bg-[#F5F7FA] py-16 sm:py-20 overflow-hidden">
      {/* Subtle Background Enhancements */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-sky-400/10 blur-[100px]"></div>
        <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[100px]"></div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
            Community Highlights
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
            Latest Announcements
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-slate-600">
            Stay updated with the latest news, events, and opportunities from our community.
          </p>
        </div>

        {loading ? (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="h-64 md:h-[400px] w-full animate-pulse rounded-2xl bg-slate-200"></div>
            </div>
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="mb-2 h-8 w-1/2 animate-pulse rounded bg-slate-200"></div>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-xl bg-slate-200"></div>
              ))}
            </div>
          </div>
        ) : featuredAnnouncement ? (
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6 lg:col-start-1">
              <AnnouncementCard announcement={featuredAnnouncement} variant="featured" />
            </div>
            
            <div className="lg:col-span-6 lg:col-start-7 flex flex-col relative">
              <h3 className="mb-6 text-xl font-bold text-slate-900 shrink-0">Recent Updates</h3>
              <div className="relative">
                <div className="flex flex-col gap-4 max-h-[300px] sm:max-h-[400px] md:max-h-[448px] overflow-y-auto pr-2 pb-2 custom-scrollbar overscroll-contain">
                  {recentAnnouncements.map((announcement) => (
                    <AnnouncementCard key={announcement.id} announcement={announcement} variant="compact" />
                  ))}
                  {recentAnnouncements.length === 0 && (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-6 text-center text-sm text-slate-500 backdrop-blur-sm">
                      No other updates available.
                    </div>
                  )}
                </div>
                {/* Subtle bottom fade indicator for scrolling */}
                {recentAnnouncements.length > 4 && (
                  <div className="absolute bottom-0 left-0 right-2 h-12 bg-gradient-to-t from-[#F5F7FA] to-transparent pointer-events-none"></div>
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
