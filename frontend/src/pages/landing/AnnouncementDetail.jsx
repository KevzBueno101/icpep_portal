import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '../../api/axios'
import api from '../../api/axios'
import ImageModal from '../../components/ImageModal'
import { ANNOUNCEMENT_DELETED_EVENT, ANNOUNCEMENT_UPDATED_EVENT } from '../../utils/announcementEvents'
import { useAuth } from '../../context/useAuth'
import toast from 'react-hot-toast'
import { Copy, ExternalLink } from 'lucide-react'

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

  const handleCopyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    } catch (err) {
      toast.error('Failed to copy link')
    }
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
              <span className="text-xs font-semibold tracking-wide" style={{ color: cat.accent }}>
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
              <h2 className="text-2xl font-bold text-white mb-6">Gallery ({images.length} photo{images.length > 1 ? 's' : ''})</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleImageClick(idx)}
                    className="rounded-xl overflow-hidden group cursor-pointer text-left"
                  >
                    <img
                      src={img.image}
                      alt={announcement.title}
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Links/URLs */}
          {announcement.links && announcement.links.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Links ({announcement.links.length})</h2>
              <div className="space-y-3">
                {announcement.links.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-4 rounded-xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${cat.border}`,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-semibold text-white truncate">
                          {link.label || link.url}
                        </span>
                      </div>
                      {link.description && (
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {link.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleCopyToClipboard(link.url)}
                        className="rounded-lg p-2 transition-colors hover:bg-white/10"
                        style={{ color: cat.accent }}
                        title="Copy link"
                      >
                        <Copy size={18} />
                      </button>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-2 transition-colors hover:bg-white/10"
                        style={{ color: cat.accent }}
                        title="Open link"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
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
