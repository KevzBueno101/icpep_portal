import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMember } from '../../context/MemberContext'
import NotificationToggle from '../../components/NotificationToggle'
import { formatCategory } from '../../utils/announcementCategories'
import { parseUrlsInText } from '../../utils/urlParser.jsx'
import { Search, Bell, Filter, ArrowRight } from 'lucide-react'

export default function MemberAnnouncements() {
  const navigate = useNavigate()
  const { announcements, annLoading } = useMember()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const categories = useMemo(() => {
    const list = new Set(['ALL'])
    announcements.forEach((a) => {
      if (a.category) list.add(a.category.toLowerCase())
    })
    return Array.from(list)
  }, [announcements])

  const filteredAnnouncements = useMemo(() => {
    let list = [...announcements].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )

    if (selectedCategory !== 'ALL') {
      list = list.filter((a) => a.category?.toLowerCase() === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.body?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q)
      )
    }

    return list
  }, [announcements, selectedCategory, searchQuery])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="mt-2 text-slate-600 text-xs sm:text-sm md:text-base">
            Stay updated with the latest news, events, and academic updates from ICPEP.SE.
          </p>
        </div>
        <NotificationToggle className="mt-1 shrink-0" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search announcements..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-bold text-slate-500 uppercase mr-1 shrink-0">
            <Filter className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span>Category:</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-1 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-semibold transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'ALL' ? 'All' : formatCategory(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      {annLoading ? (
        <div className="space-y-3 sm:space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="h-6 w-16 sm:w-20 animate-pulse rounded-full bg-slate-200" />
                <div className="h-4 w-20 sm:w-24 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="mt-3 sm:mt-4 h-5 w-3/4 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 sm:mt-3 space-y-2">
                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="mt-4 sm:mt-5 border-t border-slate-100 pt-3 sm:pt-4">
                <div className="h-4 w-24 sm:w-28 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-white border border-dashed border-slate-200 rounded-3xl text-center px-3 sm:px-4">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-3 sm:mb-4">
            <Bell className="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">No Announcements Found</h3>
          <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-sm">
            We couldn't find any announcements matching your search query or filters. Check back later!
          </p>
        </div>
      ) : (
        <div className="space-y-4 w-full min-w-0">
          {filteredAnnouncements.map((ann) => (
            <button
              key={ann.id}
              type="button"
              onClick={() => navigate(`/announcement/${ann.id}`)}
              className="group flex flex-col text-left rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition duration-200 w-full overflow-hidden max-w-full min-h-0"
            >
              {ann.first_image && (
                <div className="relative w-full overflow-hidden bg-slate-100 shrink-0">
                  <img
                    src={ann.first_image}
                    alt={ann.title || 'Announcement'}
                    loading="lazy"
                    className="h-32 w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="flex flex-col p-4 sm:p-6 overflow-hidden min-h-0">
                <div className="flex items-center justify-between gap-2 shrink-0">
                  <span className="inline-flex rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-sky-700">
                    {formatCategory(ann.category)}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400">
                    {ann.created_at ? new Date(ann.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }) : ''}
                  </span>
                </div>
                <h2 className="mt-3 sm:mt-4 text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-600 transition duration-150 truncate shrink-0">
                  {ann.title}
                </h2>
                <div className="mt-2 sm:mt-3 overflow-hidden min-h-0">
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-600 break-words overflow-hidden line-clamp-2 sm:line-clamp-3">
                    {parseUrlsInText(ann.body)}
                  </p>
                </div>
                <div className="mt-3 sm:mt-5 border-t border-slate-100 pt-3 sm:pt-4 flex justify-between items-center text-[10px] sm:text-xs font-bold text-sky-600 shrink-0">
                  <span>Read announcement</span>
                  <ArrowRight size={14} className="w-3.5 h-3.5 sm:w-4 sm:h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
