/**
 * MilestonesSection.jsx
 *
 * Backend-ready milestone/achievement timeline — dark theme, large cards, mobile-first.
 *
 * ─── BACKEND INTEGRATION ─────────────────────────────────────────────────────
 * 1. Create a Django `Milestone` model with fields matching DUMMY_MILESTONES.
 * 2. Expose GET /api/milestones/ with AllowAny permission.
 * 3. Replace useState(DUMMY_MILESTONES) with useState([]) and add:
 *
 *    import { publicApi } from '../../api/axios'
 *    useEffect(() => {
 *      publicApi.get('/milestones/')
 *        .then(res => setMilestones(res.data))
 *        .catch(() => setMilestones(DUMMY_MILESTONES))
 *    }, [])
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '../../api/axios'

const CATEGORIES = {
  founding:    { label: 'Founding',     accent: '#38bdf8', dimAccent: 'rgba(56,189,248,0.15)',  border: 'rgba(56,189,248,0.35)'  },
  achievement: { label: 'Achievement',  accent: '#34d399', dimAccent: 'rgba(52,211,153,0.15)',  border: 'rgba(52,211,153,0.35)'  },
  recognition: { label: 'Recognition',  accent: '#a78bfa', dimAccent: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)' },
  event:       { label: 'Event',        accent: '#fbbf24', dimAccent: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.35)'  },
  community:   { label: 'Community',    accent: '#f472b6', dimAccent: 'rgba(244,114,182,0.15)', border: 'rgba(244,114,182,0.35)' },
}

const DUMMY_MILESTONES = [
  {
    id: 1,
    title: 'ICPEP.SE Chapter Founded',
    description: 'The Catanduanes State University chapter of ICPEP.SE was officially established, uniting computer engineering students under one professional organization.',
    date: 'August 2019',
    category: 'founding',
    link: null,
    link_label: null,
  },
  {
    id: 2,
    title: '1st General Assembly',
    description: 'Over 120 students attended our inaugural general assembly, marking the official launch of chapter programs and the election of the first set of officers.',
    date: 'September 2019',
    category: 'event',
    link: null,
    link_label: null,
  },
  {
    id: 3,
    title: 'Best New Chapter Award',
    description: 'Recognized by the ICPEP.SE National Board as the Best New Chapter of the Year for outstanding membership growth and community engagement initiatives.',
    date: 'February 2020',
    category: 'recognition',
    link: null,
    link_label: null,
  },
  {
    id: 4,
    title: 'Hackathon Ika-Apat Championship',
    description: 'Our members swept the top three spots in the regional hackathon, developing a smart irrigation prototype that went on to compete at the national level.',
    date: 'November 2021',
    category: 'achievement',
    link: null,
    link_label: null,
  },
  {
    id: 5,
    title: 'Free Coding Bootcamp',
    description: 'Launched a free 6-week coding bootcamp open to all CatSU students, with over 200 enrollees completing modules in Python, web development, and Arduino.',
    date: 'March 2022',
    category: 'community',
    link: null,
    link_label: null,
  },
  {
    id: 6,
    title: 'National Quiz Bowl Finalist',
    description: 'Team Bitstream represented CatSU at the ICPEP National Quiz Bowl in Manila, finishing in the top 5 out of 38 competing chapters nationwide.',
    date: 'October 2023',
    category: 'achievement',
    link: null,
    link_label: null,
  },
  {
    id: 7,
    title: 'Membership Portal Launched',
    description: 'Deployed this full-stack membership portal to digitize and streamline member registration, approval workflows, and officer management for the chapter.',
    date: 'June 2026',
    category: 'community',
    link: null,
    link_label: null,
  },
]

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

export default function MilestonesSection() {
  const [milestones, setMilestones] = useState([])
  const [visibleIds, setVisibleIds] = useState(new Set())
  const [showAllMilestones, setShowAllMilestones] = useState(false)
  const rowRefs = useRef({})

  const displayedMilestones = showAllMilestones ? milestones : milestones.slice(0, 3)
  const hasHiddenMilestones = milestones.length > displayedMilestones.length

  useEffect(() => {
    const fetchMilestones = async () => {
      try {
        const res = await publicApi.get('/milestones/')
        setMilestones(res.data.results)
      } catch (err) {
        console.error('Failed to fetch milestones:', err)
        // Fallback to dummy data if API fails
        setMilestones(DUMMY_MILESTONES)
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

        {/* ── MOBILE: Single column timeline ── */}
        <div className="relative md:hidden">
          {/* Left gutter line */}
          <div
            className="absolute left-[19px] top-2 bottom-2 w-px"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(56,189,248,0.3) 10%, rgba(56,189,248,0.3) 90%, transparent)' }}
          />

          <div className="space-y-8">
            {displayedMilestones.map((milestone) => {
              const cat = CATEGORIES[milestone.category] || CATEGORIES.achievement
              const isVisible = visibleIds.has(milestone.id)

              return (
                <div
                  key={milestone.id}
                  data-id={milestone.id}
                  ref={(el) => { rowRefs.current[milestone.id] = el }}
                  className="relative flex gap-5 items-start"
                >
                  {/* Dot */}
                  <div className="relative shrink-0 mt-1 z-10">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500"
                      style={{
                        background: isVisible ? cat.dimAccent : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${isVisible ? cat.accent : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: isVisible ? `0 0 16px ${cat.dimAccent}` : 'none',
                      }}
                    >
                      <span
                        className="h-3 w-3 rounded-full transition-all duration-500"
                        style={{ background: isVisible ? cat.accent : 'rgba(255,255,255,0.2)' }}
                      />
                    </div>
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0">
                    <MilestoneCard milestone={milestone} visible={isVisible} side="left" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── DESKTOP: Alternating left/right timeline ── */}
        <div className="relative hidden md:block">
          {/* Center line */}
          <div
            className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2"
            style={{ background: 'linear-gradient(180deg, transparent, rgba(56,189,248,0.3) 8%, rgba(56,189,248,0.3) 92%, transparent)' }}
          />

          <div className="space-y-14">
            {displayedMilestones.map((milestone, index) => {
              const side = index % 2 === 0 ? 'left' : 'right'
              const cat = CATEGORIES[milestone.category] || CATEGORIES.achievement
              const isVisible = visibleIds.has(milestone.id)

              return (
                <div
                  key={milestone.id}
                  data-id={milestone.id}
                  ref={(el) => { rowRefs.current[milestone.id] = el }}
                  className="relative grid grid-cols-2 gap-0 items-center"
                >
                  {/* Left slot */}
                  <div className="pr-12 flex justify-end">
                    {side === 'left' ? (
                      <div className="w-full max-w-[400px]">
                        <MilestoneCard milestone={milestone} visible={isVisible} side="left" />
                      </div>
                    ) : (
                      /* Date label on empty side */
                      <div
                        className={`text-right transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                      >
                        <span
                          className="text-sm font-mono font-semibold tracking-wider"
                          style={{ color: cat.accent }}
                        >
                          {milestone.date}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Center dot */}
                  <div
                    className="absolute left-1/2 -translate-x-1/2 z-10"
                  >
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center transition-all duration-500"
                      style={{
                        background: isVisible ? cat.dimAccent : 'rgba(255,255,255,0.04)',
                        border: `2px solid ${isVisible ? cat.accent : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: isVisible ? `0 0 24px ${cat.dimAccent}` : 'none',
                      }}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full transition-all duration-500"
                        style={{ background: isVisible ? cat.accent : 'rgba(255,255,255,0.15)' }}
                      />
                    </div>
                  </div>

                  {/* Right slot */}
                  <div className="pl-12 flex justify-start">
                    {side === 'right' ? (
                      <div className="w-full max-w-[400px]">
                        <MilestoneCard milestone={milestone} visible={isVisible} side="right" />
                      </div>
                    ) : (
                      /* Date label on empty side */
                      <div
                        className={`transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                      >
                        <span
                          className="text-sm font-mono font-semibold tracking-wider"
                          style={{ color: cat.accent }}
                        >
                          {milestone.date}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* End cap */}
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

      </div>
    </section>
  )
}
