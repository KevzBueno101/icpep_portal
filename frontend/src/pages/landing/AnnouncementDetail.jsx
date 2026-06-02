import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '../../api/axios'
import { ANNOUNCEMENT_DELETED_EVENT, ANNOUNCEMENT_UPDATED_EVENT } from '../../utils/announcementEvents'

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

  const [announcement, setAnnouncement] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchAnnouncement = async () => {
    setLoading(true)
    try {
      const res = await publicApi.get(`/announcements/${id}/`)
      setAnnouncement(res.data)
    } catch (err) {
      console.error('Failed to fetch announcement:', err)
      setAnnouncement(null)
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

  const handleBackToAnnouncements = () => {
    navigate('/landing#announcements')
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #070E1B 0%, #030817 100%)' }}
      >
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-600" />
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

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #070E1B 0%, #030817 100%)' }}>
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
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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

          <div className="mt-8">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-5"
              style={{ background: cat.dimAccent, borderColor: cat.border }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.accent }} />
              <span className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: cat.accent }}>
                {cat.label}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">{announcement.title}</h1>

            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <p className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {formattedDate || '—'}
              </p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                By <span className="font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>{announcement.author || 'Admin'}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-12">
          {/* Body */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${cat.border}`,
              backdropFilter: 'blur(4px)',
            }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Announcement</h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {announcement.body}
            </p>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Gallery</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((img) => (
                  <div key={img.id} className="rounded-xl overflow-hidden">
                    <img
                      src={img.image}
                      alt={announcement.title}
                      className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
