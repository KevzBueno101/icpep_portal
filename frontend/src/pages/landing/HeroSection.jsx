import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { startHeroParticles } from './_heroParticles'
import { publicApi } from '../../api/axios'

// ── Value Card (Mission / Vision / Goals) ─────────────────────────────────────
function ValueCard({ title, text, accent }) {
  return (
    <div
      className="flex-1 min-w-[200px] rounded-2xl border border-white/10 bg-white/8 backdrop-blur-sm p-6 shadow-lg"
      style={{ background: 'rgba(255,255,255,0.07)' }}
    >
      <div
        className="inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-4"
        style={{ background: `${accent}22`, borderColor: `${accent}55` }}
      >
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
          {title}
        </span>
      </div>
      <p className="text-sm leading-relaxed text-white/70">{text}</p>
    </div>
  )
}



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
    <section className="relative isolate min-h-screen overflow-hidden pt-16 text-white flex flex-col">

      {/* ── Background Parallax Wrapper ── */}
      <div className="absolute inset-0 -z-10">
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          {/* Base Gradients */}
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
          <canvas ref={canvasRef} className="absolute inset-0 -z-8 h-full w-full" />

          {/* SVG overlays */}
          <div className="absolute inset-0 -z-7 pointer-events-none">
            <svg className="absolute inset-0 opacity-[0.14]" viewBox="0 0 1200 800" preserveAspectRatio="none">
              <defs>
                <pattern id="hex" width="64" height="56" patternUnits="userSpaceOnUse" patternTransform="skewX(-20)">
                  <polygon points="32,0 64,14 64,42 32,56 0,42 0,14" fill="none" stroke="rgba(6,182,212,0.85)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="1200" height="800" fill="url(#hex)" />
            </svg>

            <svg className="absolute inset-0" viewBox="0 0 1200 800" preserveAspectRatio="none">
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
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="relative flex flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 text-center">

        {/* 3 Logos */}
        <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-8 mb-10">
          {[
            { src: "/catsu.jpg", alt: "CatSU Logo" },
            { src: "/icpep_logo.png", alt: "ICpEP.SE Logo", large: true },
            { src: "/cea-logo.png", alt: "CEA Logo" },
          ].map((logo) => (
            <div
              key={logo.alt}
              className={`
                ${
                  logo.large
                    ? "h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36 scale-110 z-10"
                    : "h-14 w-14 sm:h-18 sm:w-18 md:h-24 md:w-24"
                }
                rounded-full
                overflow-hidden
                border-2 border-white/20
                bg-white/10
                shadow-lg
                backdrop-blur
                flex
                items-center
                justify-center
                shrink-0
                transition-all
                duration-300
              `}
            >
              <img
                src={logo.src}
                alt={logo.alt}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            </div>
          ))}
        </div>

        {/* Live badge */}
        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />
          </span>
          <span className="text-xs font-semibold text-cyan-200">
            Institute of Computer Engineers of the Philippines · Student Edition · CatSU Chapter
          </span>
        </div>

        {/* Main Title */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-5">
          Empowering Future<br />
          <span className="text-cyan-400">Computer Engineers</span>
        </h1>

        {/* Tagline */}
        <p className="max-w-xl text-base sm:text-lg text-white/70 leading-relaxed mb-10">
          Innovating, Building, and Leading the Future of Technology.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <a
            href="/register"
            className="group inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-8 py-3.5 text-[15px] font-semibold text-cyan-100 backdrop-blur transition hover:border-cyan-400/55 hover:bg-cyan-500/20"
          >
            <span className="mr-2">▣</span>
            Join ICPEP.SE
            <span className="ml-2 opacity-0 transition group-hover:opacity-100">↗</span>
          </a>
          <a
            href={import.meta.env.VITE_FACEBOOK_URL || 'https://www.facebook.com/Icpep.seCatSu'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-[15px] font-semibold text-white/90 backdrop-blur transition hover:border-purple-400/40 hover:bg-white/10"
          >
            <span className="mr-2">⟡</span>
            Follow us on Facebook
          </a>
        </div>

        {/* ── Mission / Vision / Goals Cards ── */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-5xl">
          <ValueCard
            title="Mission"
            text="Empower students to innovate, build, and lead as future computer engineers through technical skills, professional integrity, and academic excellence."
            accent="#38bdf8"
          />
          <ValueCard
            title="Vision"
            text="A stronger tech community where learners thrive — producing innovative, ethically responsible, and globally competent computer engineering practitioners."
            accent="#34d399"
          />
          <ValueCard
            title="Goals"
            text="Develop skills through projects, events, and hands-on learning opportunities while fostering leadership, industry connections, and national competitiveness."
            accent="#a78bfa"
          />
        </div>

      </div>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-36"
        style={{ background: 'linear-gradient(to top, rgba(3, 7, 18, 1), rgba(3, 7, 18, 0))' }}
      />
    </section>
  )
}