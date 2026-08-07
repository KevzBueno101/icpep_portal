import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '../../api/axios'

function clamp01(n) {
  return Math.min(1, Math.max(0, n))
}

const CATEGORIES = {
  founding:    { label: 'Founding',     accent: '#38bdf8', dimAccent: 'rgba(56,189,248,0.15)',  border: 'rgba(56,189,248,0.35)'  },
  achievement: { label: 'Achievement',  accent: '#34d399', dimAccent: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.35)'  },
  recognition: { label: 'Recognition',  accent: '#a78bfa', dimAccent: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)' },
  event:       { label: 'Event',        accent: '#fbbf24', dimAccent: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.35)'  },
  community:   { label: 'Community',    accent: '#f472b6', dimAccent: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.35)' },
  feature:     { label: 'Feature',      accent: '#fb923c', dimAccent: 'rgba(251,146,60,0.15)',  border: 'rgba(251,146,60,0.35)'  },
}


function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const day = d.getDate().toString().padStart(2, '0')
  const year = d.getFullYear().toString()
  return `${month} ${day} ${year}`
}

function SkeletonCard() {
  return (
    <div className="w-full animate-pulse">
      <div
        className="relative rounded-2xl p-6 sm:p-7"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="h-5 w-24 rounded-full bg-white/10" />
          <div className="h-4 w-20 rounded bg-white/10" />
        </div>
        <div className="h-6 w-3/4 rounded bg-white/10 mb-3" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-white/10" />
          <div className="h-4 w-5/6 rounded bg-white/10" />
        </div>
        <div className="h-4 w-20 rounded bg-white/10 mt-5" />
      </div>
    </div>
  )
}

function MilestoneCard({ milestone, visible, side }) {
  const cat = CATEGORIES[milestone.category] || CATEGORIES.achievement

  return (
    <Link
      to={`/milestone/${milestone.id}`}
      className={`
        w-full transition-all duration-700 ease-out block
        ${visible
          ? 'opacity-100 translate-y-0'
          : side === 'left'
            ? 'opacity-0 -translate-x-6'
            : 'opacity-0 translate-x-6'}
      `}
    >
      <div
        className="relative rounded-2xl p-6 sm:p-7 hover:scale-[1.015] transition-transform duration-300"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: `1px solid ${cat.border}`,
          backdropFilter: 'blur(4px)',
          boxShadow: `0 0 32px ${cat.dimAccent}, inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        {/* Top glow strip */}
        <div
          className="absolute top-0 left-6 right-6 h-px rounded-full"
          style={{ background: `linear-gradient(90deg, transparent, ${cat.accent}, transparent)` }}
        />

        {/* Category badge + date row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold tracking-widest uppercase"
            style={{ background: cat.dimAccent, color: cat.accent, border: `1px solid ${cat.border}` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full flex-shrink-0"
              style={{ background: cat.accent }}
            />
            {cat.label}
          </span>
          <span
            className="text-xs font-mono font-semibold tracking-wider"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {milestone.date}
          </span>
        </div>

        {/* Headline */}
        <h3
          className="text-lg sm:text-xl font-bold leading-snug mb-3"
          style={{ color: 'rgba(255,255,255,0.92)' }}
        >
          {milestone.headline}
        </h3>

        {/* Description */}
        <p
          className="text-sm sm:text-base leading-relaxed"
          style={{ color: 'rgba(255,255,255,0.55)' }}
        >
          {milestone.description}
        </p>

        {/* First image if available */}
        {milestone.first_image && (
          <div className="mt-4 rounded-xl overflow-hidden">
            <img
              src={milestone.first_image}
              alt={milestone.headline}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* View more link */}
        <div className="inline-flex items-center gap-2 mt-5 text-sm font-semibold transition-opacity duration-200 hover:opacity-80" style={{ color: cat.accent }}>
          View more
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}

function TimelineTrack({ progress, align }) {
  return (
    <>
      <div
        className={`pointer-events-none absolute ${align} top-2 bottom-2 w-px`}
        style={{ background: 'linear-gradient(180deg, transparent, rgba(56,189,248,0.3) 10%, rgba(56,189,248,0.3) 90%, transparent)' }}
      >
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: `${progress * 100}%`,
            background: 'linear-gradient(180deg, rgba(56,189,248,0.15), #38bdf8)',
            boxShadow: '0 0 8px rgba(56,189,248,0.7)',
          }}
        />
      </div>
      <div className={`pointer-events-none absolute ${align} top-2 bottom-2 z-20`}>
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ top: `${progress * 100}%`, left: '50%' }}
        >
          <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
            <path d="M9 12 L0 0 H18 Z" fill="#38bdf8" />
          </svg>
        </div>
      </div>
    </>
  )
}

export default function MilestonesSection() {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [visibleIds, setVisibleIds] = useState(new Set())
  const [showAllMilestones, setShowAllMilestones] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [circlePositions, setCirclePositions] = useState({})
  const rowRefs = useRef({})
  const timelineRef = useRef(null)
  const mobileTimelineRef = useRef(null)
  const circleElsRef = useRef({})
  const rafIdRef = useRef(null)

  const displayedMilestones = showAllMilestones ? milestones : milestones.slice(0, 3)
  const hasHiddenMilestones = milestones.length > displayedMilestones.length

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const res = await publicApi.get('/milestones/')
        setMilestones(res.data.results)
      } catch (err) {
        console.error('Failed to fetch milestones:', err)
        setMilestones([])
      } finally {
        setLoading(false)
      }
    }
    fetchMilestones()
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = Number(entry.target.dataset.id)
            setVisibleIds((prev) => new Set([...prev, id]))
          }
        })
      },
      { threshold: 0.12 }
    )
    Object.values(rowRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [milestones, showAllMilestones])

  useEffect(() => {
    setVisibleIds((prev) => {
      const next = new Set(prev)
      displayedMilestones.forEach((milestone) => next.add(milestone.id))
      return next
    })
  }, [milestones, showAllMilestones])

  const measureAndCompute = useCallback(() => {
    const wrapper = [timelineRef.current, mobileTimelineRef.current]
      .find((el) => el && el.offsetHeight > 0)
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const trackTop = rect.top + 8
    const trackHeight = Math.max(1, rect.height - 16)

    const positions = {}
    Object.entries(circleElsRef.current).forEach(([id, el]) => {
      if (!el || !wrapper.contains(el)) return
      const r = el.getBoundingClientRect()
      positions[id] = clamp01((r.top + r.height / 2 - trackTop) / trackHeight)
    })
    setCirclePositions(positions)

    const total = rect.height + window.innerHeight
    setScrollProgress(clamp01((window.innerHeight - rect.top) / total))
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (rafIdRef.current) return
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null
        measureAndCompute()
      })
    }
    const onResize = () => measureAndCompute()

    measureAndCompute()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    const ro = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => measureAndCompute())
      : null
    if (ro) {
      if (timelineRef.current) ro.observe(timelineRef.current)
      if (mobileTimelineRef.current) ro.observe(mobileTimelineRef.current)
    }

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      if (ro) ro.disconnect()
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [measureAndCompute, displayedMilestones.length])

  return (
    <section
        id="milestones"
        className="bg-transparent py-24 sm:py-32 relative z-10 overflow-hidden"
      >
      {/* Subtle grid bg */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glow orb top */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20"
        style={{ background: 'radial-gradient(ellipse, rgba(56,189,248,0.5), transparent 70%)' }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="mb-16 sm:mb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-sky-300">
              Our Journey
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            Chapter Milestones
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
            A living record of the achievements, events, and landmarks that define our chapter's story.
          </p>
        </div>

        {/* ── Empty state ── */}
        {!loading && milestones.length === 0 && (
          <div className="mx-auto max-w-md text-center py-12">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-white/5 mb-5">
              <svg className="h-8 w-8 text-white/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-base text-white/40">No milestones recorded yet.</p>
          </div>
        )}

        {/* ── MOBILE: Single column timeline ── */}
        {milestones.length > 0 && <div ref={mobileTimelineRef} className="relative md:hidden">
          <TimelineTrack progress={scrollProgress} align="left-[19px] -translate-x-1/2" />

          {loading ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative flex gap-5 items-start">
                  <div className="relative shrink-0 mt-1 z-10">
                    <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <SkeletonCard />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              {displayedMilestones.map((milestone) => {
                const cat = CATEGORIES[milestone.category] || CATEGORIES.achievement
                const isVisible = visibleIds.has(milestone.id)
                const isActive = scrollProgress >= (circlePositions[milestone.id] ?? 1)

                return (
                  <div
                    key={milestone.id}
                    data-id={milestone.id}
                    ref={(el) => { rowRefs.current[milestone.id] = el }}
                    className="relative flex gap-5 items-start"
                  >
                    <div className="relative shrink-0 mt-1 z-10">
                      <div
                        ref={(el) => { circleElsRef.current[milestone.id] = el }}
                        className="h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110"
                        style={{
                          background: isActive ? cat.dimAccent : 'rgba(255,255,255,0.05)',
                          border: `2px solid ${isActive ? cat.accent : 'rgba(255,255,255,0.1)'}`,
                          boxShadow: isActive ? `0 0 16px ${cat.dimAccent}` : 'none',
                        }}
                      >
                        <span
                          className="h-3 w-3 rounded-full transition-all duration-500"
                          style={{ background: isActive ? cat.accent : 'rgba(255,255,255,0.2)' }}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <MilestoneCard milestone={milestone} visible={isVisible} side="left" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>}

        {/* ── DESKTOP: Alternating left/right timeline ── */}
        {milestones.length > 0 && <div ref={timelineRef} className="relative hidden md:block">
          <TimelineTrack progress={scrollProgress} align="left-1/2 -translate-x-1/2" />

          {loading ? (
            <div className="space-y-14">
              {[1, 2, 3, 4].map((_, index) => {
                const side = index % 2 === 0 ? 'left' : 'right'
                return (
                  <div key={index} className="relative grid grid-cols-2 gap-0 items-center">
                    <div className="pr-12 flex justify-end">
                      {side === 'left' ? (
                        <div className="w-full max-w-[400px]">
                          <SkeletonCard />
                        </div>
                      ) : (
                        <div className="h-4 w-24 rounded bg-white/10 animate-pulse ml-auto" />
                      )}
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 z-10">
                      <div className="h-12 w-12 rounded-full bg-white/5 animate-pulse" />
                    </div>
                    <div className="pl-12 flex justify-start">
                      {side === 'right' ? (
                        <div className="w-full max-w-[400px]">
                          <SkeletonCard />
                        </div>
                      ) : (
                        <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-14">
              {displayedMilestones.map((milestone, index) => {
                const side = index % 2 === 0 ? 'left' : 'right'
                const cat = CATEGORIES[milestone.category] || CATEGORIES.achievement
                const isVisible = visibleIds.has(milestone.id)
                const isActive = scrollProgress >= (circlePositions[milestone.id] ?? 1)

                return (
                  <div
                    key={milestone.id}
                    data-id={milestone.id}
                    ref={(el) => { rowRefs.current[milestone.id] = el }}
                    className="relative grid grid-cols-2 gap-0 items-center"
                  >
                    <div className="pr-12 flex justify-end">
                      {side === 'left' ? (
                        <div className="w-full max-w-[400px]">
                          <MilestoneCard milestone={milestone} visible={isVisible} side="left" />
                        </div>
                      ) : (
                        <div
                          className={`text-right transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                        >
                          <span
                            className="text-sm font-mono font-semibold tracking-wider"
                            style={{ color: cat.accent }}
                          >
                            {formatDate(milestone.date)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className="absolute left-1/2 -translate-x-1/2 z-10"
                    >
                      <div
                        ref={(el) => { circleElsRef.current[milestone.id] = el }}
                        className="h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500 hover:scale-110"
                        style={{
                          background: isActive ? cat.dimAccent : 'rgba(255,255,255,0.04)',
                          border: `2px solid ${isActive ? cat.accent : 'rgba(255,255,255,0.1)'}`,
                          boxShadow: isActive ? `0 0 24px ${cat.dimAccent}` : 'none',
                        }}
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full transition-all duration-500"
                          style={{ background: isActive ? cat.accent : 'rgba(255,255,255,0.15)' }}
                        />
                      </div>
                    </div>

                    <div className="pl-12 flex justify-start">
                      {side === 'right' ? (
                        <div className="w-full max-w-[400px]">
                          <MilestoneCard milestone={milestone} visible={isVisible} side="right" />
                        </div>
                      ) : (
                        <div
                          className={`transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                        >
                          <span
                            className="text-sm font-mono font-semibold tracking-wider"
                            style={{ color: cat.accent }}
                          >
                            {formatDate(milestone.date)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>}

        {/* End cap */}
        {!loading && milestones.length > 0 && (
          <div className="mt-16 flex justify-center">
            <button
              type="button"
              disabled={!hasHiddenMilestones}
              onClick={() => setShowAllMilestones(true)}
              className="flex items-center gap-3 rounded-full px-6 py-3 text-sm font-semibold transition hover:border-sky-300/50 hover:text-white disabled:cursor-default disabled:hover:border-sky-400/25"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(56,189,248,0.25)',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              <span
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ background: '#38bdf8' }}
              />
              {hasHiddenMilestones ? `More milestones ahead (${milestones.length - displayedMilestones.length})` : 'All milestones shown'}
            </button>
          </div>
        )}

      </div>
    </section>
  )
}

