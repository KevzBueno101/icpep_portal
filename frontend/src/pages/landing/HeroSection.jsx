import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { startHeroParticles } from './_heroParticles'
import { publicApi } from '../../api/axios'

export default function HeroSection() {
  const navigate = useNavigate()
  const canvasRef = useRef(null)
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const stop = startHeroParticles(canvas, { accent: '#06B6D4' })
    return () => stop && stop()
  }, [])

  useEffect(() => {
    const fetchPinnedAnnouncements = async () => {
      try {
        const res = await publicApi.get('/announcements/')
        const pinned = res.data.results
          .filter(ann => ann.pinned && ann.is_published)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 2)
        setPinnedAnnouncements(pinned)
      } catch (err) {
        console.error('Failed to fetch pinned announcements:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchPinnedAnnouncements()
  }, [])

  return (
    <>
      <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden pt-16 text-white">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(800px 400px at 15% 10%, rgba(37, 99, 235, 0.35), transparent 60%), radial-gradient(700px 360px at 85% 20%, rgba(124, 58, 237, 0.25), transparent 55%), linear-gradient(135deg, #070E1B 0%, #061226 45%, #030817 100%)',
        }}
      />

      {/* Glowing grid */}
      <div className="absolute inset-0 -z-9 opacity-80">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(6,182,212,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.08) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage:
              'radial-gradient(600px 320px at 50% 10%, rgba(0,0,0,1) 35%, rgba(0,0,0,0) 70%)',
          }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 top-0 h-[520px] w-[920px]"
          style={{
            background:
              'radial-gradient(circle at 50% 20%, rgba(6,182,212,0.20), transparent 55%)',
          }}
        />
      </div>

      {/* Particles canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 -z-8 h-full w-full"
      />

      {/* SVG overlays (hex + traces + waveform) */}
      <div className="absolute inset-0 -z-7 pointer-events-none">
        {/* Hex pattern */}
        <svg
          className="absolute inset-0 opacity-[0.14]"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern
              id="hex"
              width="64"
              height="56"
              patternUnits="userSpaceOnUse"
              patternTransform="skewX(-20)"
            >
              <polygon
                points="32,0 64,14 64,42 32,56 0,42 0,14"
                fill="none"
                stroke="rgba(6,182,212,0.85)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect x="0" y="0" width="1200" height="800" fill="url(#hex)" />
        </svg>

        {/* Circuit traces */}
        <svg
          className="absolute inset-0"
          viewBox="0 0 1200 800"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgba(37, 99, 235, 0.75)" />
              <stop offset="1" stopColor="rgba(124, 58, 237, 0.75)" />
            </linearGradient>
          </defs>
          <g fill="none" stroke="url(#trace)" strokeWidth="1.2">
            <path d="M80 620 C 170 520, 250 520, 330 450 S 520 330, 640 380 S 820 520, 980 420" opacity="0.35" />
            <path d="M110 260 C 220 310, 280 280, 350 240 S 520 120, 650 180 S 860 270, 1050 210" opacity="0.22" />
            <path d="M190 720 C 260 660, 320 620, 410 610 S 620 630, 740 580 S 980 460, 1130 520" opacity="0.16" />
          </g>

          {/* Animated pulse */}
          <g opacity="0.65">
            <circle cx="330" cy="450" r="4" fill="#06B6D4">
              <animate attributeName="r" values="3;9" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.85;0" dur="2.4s" repeatCount="indefinite" />
            </circle>
            <circle cx="650" cy="180" r="3" fill="#7C3AED">
              <animate attributeName="r" values="2;8" dur="3.2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.75;0" dur="3.2s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>

        {/* Waveform */}
        <svg
          className="absolute left-1/2 -translate-x-1/2 bottom-[-18px] w-[920px] opacity-60"
          viewBox="0 0 920 140"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80 C 60 40, 120 120, 180 80 S 300 40, 360 80 S 480 120, 540 80 S 660 40, 720 80 S 840 120, 920 80"
            fill="none"
            stroke="rgba(6,182,212,0.75)"
            strokeWidth="1.5"
          >
            <animate
              attributeName="stroke-dasharray"
              values="0 30; 40 30; 0 30"
              dur="3s"
              repeatCount="indefinite"
            />
          </path>
          <path
            d="M0 95 C 70 55, 140 135, 210 95 S 330 55, 400 95 S 520 135, 590 95 S 710 55, 780 95 S 860 135, 920 95"
            fill="none"
            stroke="rgba(124,58,237,0.55)"
            strokeWidth="1.2"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="grid min-h-[calc(100svh-8rem)] items-center gap-8 py-8 sm:py-10 lg:grid-cols-12 lg:gap-12 lg:py-10">
          {/* Left */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
              </span>
              <span className="text-xs font-semibold text-cyan-200">
                Institue of Computer Engineers of the Philippines. Student Edition - CatSU Chapter
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              Empowering Future Computer Engineers
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              Innovating, Building, and Leading the Future of Technology.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/register"
                className="group inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-7 py-3 text-[15px] font-semibold text-cyan-100 backdrop-blur transition hover:border-cyan-400/55 hover:bg-cyan-500/15"
              >
                <span className="mr-2">▣</span>
                Join ICPEP.SE
                <span className="ml-2 opacity-0 transition group-hover:opacity-100">↗</span>
              </Link>

              <a
                href={
                  import.meta.env.VITE_FACEBOOK_URL ||
                  'https://www.facebook.com/'
                }
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-7 py-3 text-[15px] font-semibold text-white/90 backdrop-blur transition hover:border-purple-400/40 hover:bg-white/8"
              >
                <span className="mr-2">⟡</span>
                Follow us on Facebook
              </a>
            </div>
          </div>

          {/* Right: Events preview cards */}
          <div className="lg:col-span-5">
            <div className="relative">
              <div className="relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_40px_rgba(6,182,212,0.12)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.55)]" />
                    <div className="text-sm font-semibold text-white/90">Featured</div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    NEW
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {loading ? (
                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-center text-white/60 text-sm">
                      Loading events...
                    </div>
                  ) : pinnedAnnouncements.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-center text-white/60 text-sm">
                      No upcoming events
                    </div>
                  ) : (
                    pinnedAnnouncements.map((announcement, index) => {
                      const date = announcement.created_at ? new Date(announcement.created_at) : null
                      const month = date ? date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase() : 'TBD'
                      const day = date ? date.getDate() : '--'
                      const accentColor = index === 0 ? 'cyan' : 'purple'
                      
                      return (
                        <div
                          key={announcement.id}
                          className="rounded-2xl border border-white/10 bg-black/10 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold uppercase tracking-wide text-white/60">
                                {announcement.category || 'Event'}
                              </div>
                              <div className="mt-1 text-base font-semibold text-white/90 truncate">
                                {announcement.title}
                              </div>
                              <div className="mt-1 text-sm text-white/70 line-clamp-2">
                                {announcement.body}
                              </div>

                              <div className="mt-4">
                                <button
                                  onClick={() => navigate(`/announcement/${announcement.id}`)}
                                  className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 backdrop-blur transition hover:bg-white/10"
                                >
                                  View more →
                                </button>
                              </div>
                            </div>
                            <div className={`rounded-xl border border-${accentColor}-400/25 bg-${accentColor}-500/10 px-3 py-2 text-center flex-shrink-0`}>
                              <div className={`text-[11px] font-semibold text-${accentColor}-200`}>{month}</div>
                              <div className="text-xl font-bold text-white">{day}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Diagonal overlay border */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-3xl"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(6,182,212,0.0), rgba(6,182,212,0.18), rgba(124,58,237,0.0))',
                    WebkitMaskImage:
                      'radial-gradient(closest-side at 30% 20%, rgba(0,0,0,1), rgba(0,0,0,0))',
                    maskImage:
                      'radial-gradient(closest-side at 30% 20%, rgba(0,0,0,1), rgba(0,0,0,0))',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fading glow */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36"
        style={{
          background:
            'linear-gradient(to top, rgba(3, 7, 18, 1), rgba(3, 7, 18, 0))',
        }}
      />
    </section>
    </>
  )
}

