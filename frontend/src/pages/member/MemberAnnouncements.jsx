import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMember } from '../../context/MemberContext'
import { Search, Bell, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

export default function MemberAnnouncements() {
  const navigate = useNavigate()
  const scrollRef = useRef(null)
  const { announcements, annLoading } = useMember()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  const categories = useMemo(() => {
    const list = new Set(['ALL'])
    announcements.forEach((a) => {
      if (a.category) list.add(a.category.toUpperCase())
    })
    return Array.from(list)
  }, [announcements])

  const filteredAnnouncements = useMemo(() => {
    let list = [...announcements].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )

    if (selectedCategory !== 'ALL') {
      list = list.filter((a) => a.category?.toUpperCase() === selectedCategory)
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <Bell className="h-8 w-8 text-sky-600" />
          Announcements Feed
        </h1>
        <p className="mt-2 text-slate-600 text-sm md:text-base">
          Stay updated with the latest news, events, and academic updates from ICPEP.SE.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
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
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase mr-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Category:</span>
          </div>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === cat
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      {annLoading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl shadow-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600 mb-4" />
          <p className="text-slate-600 font-medium">Loading announcements...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-200 rounded-3xl text-center px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
            <Bell className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No Announcements Found</h3>
          <p className="mt-2 text-sm text-slate-500 max-w-sm">
            We couldn't find any announcements matching your search query or filters. Check back later!
          </p>
        </div>
      ) : (
        <div className="relative w-full">
          {/* Left Arrow */}
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: -300, behavior: 'smooth' })}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white bg-opacity-80 p-2 shadow-md hover:bg-opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-slate-600" />
          </button>
          {/* Scroll Container */}
          <div
            ref={scrollRef}
            className="flex flex-nowrap gap-6 overflow-x-scroll scroll-smooth py-2 snap-x snap-mandatory w-full"
            style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
          >
            {filteredAnnouncements.map((ann) => (
              <button
                key={ann.id}
                type="button"
                onClick={() => navigate(`/announcement/${ann.id}`)}
                className="group flex flex-col text-left rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-200 min-w-[280px] snap-start"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="inline-flex rounded-full bg-sky-50 border border-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
                    {ann.category || 'General'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {ann.created_at ? new Date(ann.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }) : ''}
                  </span>
                </div>
                <h2 className="mt-4 text-lg font-bold text-slate-900 group-hover:text-sky-600 transition duration-150">
                  {ann.title}
                </h2>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600 flex-1">
                  {ann.body}
                </p>
                <div className="mt-5 border-t border-slate-100 pt-4 flex justify-between items-center text-xs font-bold text-sky-600">
                  <span>Read announcement</span>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4 transform group-hover:translate-x-1 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
          {/* Right Arrow */}
          <button
            onClick={() => scrollRef.current?.scrollBy({ left: 300, behavior: 'smooth' })}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white bg-opacity-80 p-2 shadow-md hover:bg-opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  )
}
