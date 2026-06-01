import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { publicApi } from '../../api/axios'

const CATEGORIES = {
  founding:    { label: 'Founding',     accent: '#38bdf8', dimAccent: 'rgba(56,189,248,0.15)',  border: 'rgba(56,189,248,0.35)'  },
  achievement: { label: 'Achievement',  accent: '#34d399', dimAccent: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.35)'  },
  recognition: { label: 'Recognition',  accent: '#a78bfa', dimAccent: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)' },
  event:       { label: 'Event',        accent: '#fbbf24', dimAccent: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.35)'  },
  community:   { label: 'Community',    accent: '#f472b6', dimAccent: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.35)' },
}

export default function MilestoneDetail() {
  const { id } = useParams()
  const [milestone, setMilestone] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAllImages, setShowAllImages] = useState(false)

  const navigate = useNavigate()

  const handleBackToTimeline = () => {
    // Navigate first, then scroll after Landing renders.
    navigate('/landing#milestones', { state: { scrollTo: 'milestones' } })
  }

  useEffect(() => {
    const fetchMilestone = async () => {
      try {
        const res = await publicApi.get(`/milestones/${id}/`)
        setMilestone(res.data)
      } catch (err) {
        console.error('Failed to fetch milestone:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMilestone()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #070E1B 0%, #030817 100%)' }}>
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-600" />
      </div>
    )
  }

  if (!milestone) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #070E1B 0%, #030817 100%)' }}>
        <div className="text-center">
          <p className="text-white text-lg">Milestone not found</p>
          <button
            type="button"
            onClick={handleBackToTimeline}
            className="mt-4 inline-block text-sky-400 hover:text-sky-300"
          >
            Back to timeline
          </button>
        </div>
      </div>
    )
  }

  const cat = CATEGORIES[milestone.category] || CATEGORIES.achievement
  const images = milestone.images || []
  const displayImages = showAllImages ? images : images.slice(0, 3)

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

      {/* Header */}
      <div className="relative pt-20 pb-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={handleBackToTimeline}
            className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity duration-200 hover:opacity-80"
            style={{ color: cat.accent }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to timeline
          </button>

          <div className="mt-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 mb-5" style={{ background: cat.dimAccent, borderColor: cat.border }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: cat.accent }} />
              <span className="text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: cat.accent }}>
                {cat.label}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
              {milestone.title}
            </h1>
            <p className="text-lg" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {milestone.date}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-12">
          {/* Description */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${cat.border}`,
              backdropFilter: 'blur(4px)',
            }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Overview</h2>
            <p className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {milestone.description}
            </p>
          </div>

          {/* Full Content */}
          <div
            className="rounded-2xl p-6 sm:p-8"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${cat.border}`,
              backdropFilter: 'blur(4px)',
            }}
          >
            <h2 className="text-2xl font-bold text-white mb-4">Details</h2>
            <div className="text-base leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {milestone.content}
            </div>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Gallery</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayImages.map((img) => (
                  <div key={img.id} className="rounded-xl overflow-hidden">
                    <img
                      src={img.image}
                      alt={milestone.title}
                      className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
              {images.length > 3 && !showAllImages && (
                <button
                  onClick={() => setShowAllImages(true)}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition-opacity duration-200 hover:opacity-80"
                  style={{ color: cat.accent }}
                >
                  View all {images.length} images
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
              {showAllImages && (
                <button
                  onClick={() => setShowAllImages(false)}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold transition-opacity duration-200 hover:opacity-80"
                  style={{ color: cat.accent }}
                >
                  Show less
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
