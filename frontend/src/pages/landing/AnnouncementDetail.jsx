import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '../../api/axios'
import api from '../../api/axios'
import ImageModal from '../../components/ImageModal'
import ImageCarousel from '../../components/ImageCarousel'
import { ANNOUNCEMENT_DELETED_EVENT, ANNOUNCEMENT_UPDATED_EVENT } from '../../utils/announcementEvents'
import { useAuth } from '../../context/useAuth'
import { parseUrlsInText } from '../../utils/urlParser.jsx'
import { Calendar, Clock, MapPin, User, Link as LinkIcon } from 'lucide-react'

const CATEGORY_COLORS = {
  announcement: {
    label: 'Announcement',
    accent: '#38bdf8',
    dimAccent: 'rgba(56,189,248,0.15)',
    border: 'rgba(56,189,248,0.35)',
  },
  achievement: {
    label: 'Achievement',
    accent: '#34d399',
    dimAccent: 'rgba(52,211,153,0.15)',
    border: 'rgba(52,211,153,0.35)',
  },
  update: {
    label: 'Update',
    accent: '#60a5fa',
    dimAccent: 'rgba(96,165,250,0.15)',
    border: 'rgba(96,165,250,0.35)',
  },
  opportunity: {
    label: 'Opportunity',
    accent: '#fbbf24',
    dimAccent: 'rgba(251,191,36,0.15)',
    border: 'rgba(251,191,36,0.35)',
  },
  event: {
    label: 'Event',
    accent: '#a78bfa',
    dimAccent: 'rgba(167,139,250,0.15)',
    border: 'rgba(167,139,250,0.35)',
  },
}

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function AnnouncementDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)
  const [requiresLogin, setRequiresLogin] = useState(false)
  const [modalImages, setModalImages] = useState(null)
  const [modalInitialIndex, setModalInitialIndex] = useState(0)

  const fetchAnnouncement = async () => {
    setLoading(true)
    setRequiresLogin(false)
    try {
      const client = user && user.role !== 'ADMIN' ? api : publicApi
      const res = await client.get(`/announcements/${id}/${user ? '?include_members_only=1' : ''}`)
      setAnnouncement(res.data)
    } catch (err) {
      console.error('Failed to fetch announcement:', err)
      setAnnouncement(null)
      if (err.response?.status === 404 && !user) {
        setRequiresLogin(true)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnnouncement()

    const handleAnnouncementUpdated = (event) => {
      if (String(event.detail?.id) === String(id)) {
        fetchAnnouncement()
      }
    }

    const handleAnnouncementDeleted = (event) => {
      if (String(event.detail?.id) === String(id)) {
        fetchAnnouncement()
      }
    }

    window.addEventListener(ANNOUNCEMENT_UPDATED_EVENT, handleAnnouncementUpdated)
    window.addEventListener(ANNOUNCEMENT_DELETED_EVENT, handleAnnouncementDeleted)

    return () => {
      window.removeEventListener(ANNOUNCEMENT_UPDATED_EVENT, handleAnnouncementUpdated)
      window.removeEventListener(ANNOUNCEMENT_DELETED_EVENT, handleAnnouncementDeleted)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const cat = useMemo(() => {
    const key = announcement?.category
    return CATEGORY_COLORS[key] || CATEGORY_COLORS.announcement
  }, [announcement])

  const images = announcement?.images || []

  const handleImageClick = (index) => {
    const urls = images.map(img => img.image)
    setModalImages(urls)
    setModalInitialIndex(index)
  }

  const handleCloseModal = () => {
    setModalImages(null)
    setModalInitialIndex(0)
  }

  const handleBackToAnnouncements = () => {
    if (user && user.role !== 'ADMIN') {
      if (window.history.state && window.history.state.idx > 0) {
        navigate(-1)
      } else {
        navigate('/member/announcements')
      }
    } else {
      navigate('/landing#announcements')
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-start justify-center p-6"
        style={{ background: 'linear-gradient(180deg, #070E1B 0%, #030817 100%)' }}
      >
        <div className="mt-20 w-full max-w-3xl space-y-6">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-700" />
          <div className="h-8 w-3/4 animate-pulse rounded bg-slate-700" />
          <div className="h-5 w-32 animate-pulse rounded-full bg-slate-700" />
          <div className="space-y-3 pt-4">
            <div className="h-4 w-full animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-4/6 animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-700" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-700" />
          </div>
        </div>
      </div>
    )
  }

  if (requiresLogin) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #070E1B 0%, #030817 100%)' }}
      >
        <div className="text-center px-4">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sky-500/10 ring-1 ring-sky-500/30">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">This announcement is for members</h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Log in to your ICpEP.SE member account to view this announcement.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login', { state: { from: `/announcement/${id}` } })}
            className="mt-6 inline-block rounded-lg bg-sky-600 px-6 py-3 text-white font-semibold hover:bg-sky-700"
          >
            Log in to view
          </button>
          <div className="mt-4 space-x-3">
            <button
              type="button"
              onClick={handleBackToAnnouncements}
              className="inline-block text-sky-400 hover:text-sky-300 text-sm"
            >
              Back to announcements
            </button>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>•</span>
            <Link to="/register" className="inline-block text-sky-400 hover:text-sky-300 text-sm">
              Not a member yet? Register
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!announcement) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #070E1B 0%, #030817 100%)' }}
      >
        <div className="text-center">
          <p className="text-white text-lg">Announcement not found</p>
          <button
            type="button"
            onClick={handleBackToAnnouncements}
            className="mt-4 inline-block text-sky-400 hover:text-sky-300"
          >
            Back to announcements
          </button>
        </div>
      </div>
    )
  }

  const formattedDate = formatDate(announcement.created_at)
  
  // Format event date range
  const formatDateRange = (start, end) => {
    if (!start && !end) return null
    const startDate = start ? formatDate(start) : ''
    const endDate = end ? formatDate(end) : ''
    if (startDate && endDate && startDate !== endDate) {
      return `${startDate} - ${endDate}`
    }
    return startDate || endDate
  }
  
  // Format time range
  const formatTimeRange = (start, end) => {
    if (!start && !end) return null
    const formatTime = (time) => {
      if (!time) return ''
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours, 10)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const hour12 = hour % 12 || 12
      return `${hour12}:${minutes} ${ampm}`
    }
    const startTime = formatTime(start)
    const endTime = formatTime(end)
    if (startTime && endTime && startTime !== endTime) {
      return `${startTime} - ${endTime}`
    }
    return startTime || endTime
  }
  
  // Extract URLs from body for links section
  const extractUrls = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const matches = text.match(urlRegex)
    return matches || []
  }
  
  const urls = extractUrls(announcement.body || '')
  
  // Parse tags
  const tags = announcement.tags ? announcement.tags.split(',').map(tag => tag.trim()).filter(Boolean) : []

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #070E1B 0%, #030817 100%)' }}>
      {modalImages && (
        <ImageModal images={modalImages} initialIndex={modalInitialIndex} onClose={handleCloseModal} />
      )}
      {/* Subtle grid bg */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative pt-20 pb-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBackToAnnouncements}
            className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity duration-200 hover:opacity-80"
            style={{ color: cat.accent }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to announcements
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Carousel */}
            {images.length > 0 && (
              <ImageCarousel 
                images={images} 
                className="w-full"
                onImageClick={handleImageClick}
              />
            )}
            
            {/* Headline */}
            <div>
              <div
                className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-4"
                style={{ background: cat.dimAccent, borderColor: cat.border }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.accent }} />
                <span className="text-xs font-semibold tracking-wide" style={{ color: cat.accent }}>
                  {cat.label}
                </span>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                      style={{
                        background: 'rgba(255,255,255,0.1)',
                        color: 'rgba(255,255,255,0.9)',
                        border: '1px solid rgba(255,255,255,0.2)',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{announcement.title}</h1>
              <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {formattedDate || '—'}
              </p>
            </div>
            
            {/* Body */}
            <div
              className="rounded-2xl p-6 sm:p-8 overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${cat.border}`,
                backdropFilter: 'blur(4px)',
              }}
            >
              <p className="text-base leading-relaxed whitespace-pre-wrap break-words overflow-hidden" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {parseUrlsInText(announcement.body)}
              </p>
            </div>
          </div>
          
          {/* Right Column - Details Sidebar */}
          <div className="lg:col-span-1">
            <div
              className="rounded-2xl p-6 sticky top-24"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${cat.border}`,
                backdropFilter: 'blur(4px)',
              }}
            >
              <h2 className="text-lg font-bold text-white mb-6">Details</h2>
              
              <div className="space-y-4">
                {/* Event Date Range */}
                {formatDateRange(announcement.event_date_start, announcement.event_date_end) && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cat.accent }} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Event Date
                      </p>
                      <p className="text-sm text-white">
                        {formatDateRange(announcement.event_date_start, announcement.event_date_end)}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Event Time Range */}
                {formatTimeRange(announcement.event_time_start, announcement.event_time_end) && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cat.accent }} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Event Time
                      </p>
                      <p className="text-sm text-white">
                        {formatTimeRange(announcement.event_time_start, announcement.event_time_end)}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Location */}
                {announcement.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cat.accent }} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Location
                      </p>
                      <p className="text-sm text-white">{announcement.location}</p>
                    </div>
                  </div>
                )}
                
                {/* Author */}
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cat.accent }} />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      Author
                    </p>
                    {announcement.author && announcement.author.includes(',') ? (
                      <p className="text-sm text-white">
                        {announcement.author.split(',')[0].trim()}
                        {announcement.author.split(',')[1] && (
                          <>, <em className="opacity-80">{announcement.author.split(',')[1].trim()}</em></>
                        )}
                      </p>
                    ) : (
                      <p className="text-sm text-white">{announcement.author || 'Admin'}</p>
                    )}
                  </div>
                </div>
                
                {/* Links */}
                {urls.length > 0 && (
                  <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="flex items-start gap-3 mb-3">
                      <LinkIcon className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cat.accent }} />
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Links
                      </p>
                    </div>
                    <div className="space-y-2 pl-8">
                      {urls.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-sm text-sky-400 hover:text-sky-300 transition-colors break-all"
                        >
                          {url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Created Date */}
                <div className="pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 shrink-0 mt-0.5" style={{ color: cat.accent }} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        Posted
                      </p>
                      <p className="text-sm text-white">{formattedDate || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
