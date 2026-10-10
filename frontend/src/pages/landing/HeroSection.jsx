import { useEffect, useRef, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { Info } from 'lucide-react'

import { startHeroParticles } from './_heroParticles'
import { startPCBSignals } from './_pcbSignals'

import { publicApi } from '../../api/axios'

import { registerLogoTap } from '../../utils/logoSecretTaps'



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



  // Particles disabled as per requirements - using PCB signals instead
  // useEffect(() => {
  //   const canvas = canvasRef.current
  //   if (!canvas) return
  //   const stop = startHeroParticles(canvas, { accent: '#06B6D4' })
  //   return () => stop && stop()
  // }, [])

  // PCB Signal Animation with responsive routes
  useEffect(() => {
    const checkMobile = () => window.innerWidth < 768
    let isMobile = checkMobile()
    let stopPCBSignals = startPCBSignals('pcb-svg', isMobile)

    const handleResize = () => {
      const newIsMobile = checkMobile()
      if (newIsMobile !== isMobile) {
        isMobile = newIsMobile
        if (stopPCBSignals) stopPCBSignals()
        stopPCBSignals = startPCBSignals('pcb-svg', isMobile)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (stopPCBSignals) stopPCBSignals()
    }
  }, [])



  const handleLogoTap = () => {

    if (registerLogoTap()) {

      navigate('/admin-portal/login')

    }

  }



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

    <section className="relative isolate min-h-screen pt-16 text-white flex flex-col">



      {/* ── Background Parallax Wrapper ── */}

      <div className="fixed inset-0 -z-10 h-screen w-full overflow-hidden">

        {/* Base Gradients - Updated to PCB color scheme */}

        <div

          className="absolute inset-0 -z-10"

          style={{

            background:

              'linear-gradient(135deg, #050B18 0%, #0A192F 45%, #050B18 100%)',

          }}

        />



        {/* Glowing grid removed - using PCB traces instead */}

        {/* Particles canvas disabled - using PCB signals instead */}
        {/* <canvas ref={canvasRef} className="absolute inset-0 -z-8 h-full w-full" /> */}

        {/* SVG overlays */}

        <div className="absolute inset-0 -z-7 pointer-events-none">

          {/* PCB Circuit Traces - Static Background Pattern */}
          {/* Desktop pattern - more complex */}
          <svg className="absolute inset-0 opacity-[0.4] hidden md:block" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <defs>
              <pattern id="pcb-pattern" width="300" height="300" patternUnits="userSpaceOnUse">
                {/* Continuous primary traces - Muted blue */}
                <path d="M0,30 L100,30 L130,60 L130,150 L180,150 L180,250" stroke="#1B4D80" strokeWidth="1.5" fill="none" />
                <path d="M150,0 L150,80 L180,110 L250,110 L250,180" stroke="#1B4D80" strokeWidth="1.5" fill="none" />
                <path d="M50,50 L200,50 L220,70 L220,200" stroke="#1B4D80" strokeWidth="1.5" fill="none" />
                
                {/* Continuous secondary traces - Dark cyan */}
                <path d="M0,180 L70,180 L100,210 L200,210 L230,240 L300,240" stroke="#126E82" strokeWidth="1.2" fill="none" />
                <path d="M50,0 L50,120 L80,150 L80,250 L120,290 L300,290" stroke="#126E82" strokeWidth="1.2" fill="none" />
                <path d="M100,0 L100,100 L130,130 L250,130 L280,160 L300,160" stroke="#126E82" strokeWidth="1.2" fill="none" />
                
                {/* Parallel bus traces - continuous */}
                <path d="M0,220 L120,220 L150,250 L300,250" stroke="#1B4D80" strokeWidth="1.5" fill="none" />
                <path d="M0,226 L120,226 L150,256 L300,256" stroke="#1B4D80" strokeWidth="1.5" fill="none" />
                <path d="M0,232 L120,232 L150,262 L300,262" stroke="#1B4D80" strokeWidth="1.5" fill="none" />
                
                {/* T-junction with continuous path */}
                <path d="M50,80 L110,80 L140,110 L140,200" stroke="#1B4D80" strokeWidth="1.5" fill="none" />
                <path d="M80,30 L80,80" stroke="#1B4D80" strokeWidth="1.5" />
                
                {/* Additional continuous traces */}
                <path d="M200,0 L200,60 L230,90 L300,90" stroke="#126E82" strokeWidth="1.2" fill="none" />
                <path d="M250,0 L250,50 L280,80 L300,80" stroke="#1B4D80" strokeWidth="1.5" fill="none" />
                <path d="M0,270 L80,270 L110,300 L300,300" stroke="#126E82" strokeWidth="1.2" fill="none" />
                
                {/* Solder pads at junctions */}
                <circle cx="100" cy="30" r="3" fill="#126E82" />
                <circle cx="130" cy="60" r="3" fill="#126E82" />
                <circle cx="130" cy="150" r="3" fill="#126E82" />
                <circle cx="70" cy="180" r="3" fill="#126E82" />
                <circle cx="100" cy="210" r="3" fill="#126E82" />
                <circle cx="80" cy="80" r="3" fill="#126E82" />
                <circle cx="110" cy="80" r="3" fill="#126E82" />
                <circle cx="140" cy="110" r="3" fill="#126E82" />
                <circle cx="120" cy="220" r="3" fill="#126E82" />
                <circle cx="120" cy="226" r="3" fill="#126E82" />
                <circle cx="120" cy="232" r="3" fill="#126E82" />
                <circle cx="150" cy="250" r="3" fill="#126E82" />
                <circle cx="200" cy="50" r="3" fill="#126E82" />
                <circle cx="220" cy="70" r="3" fill="#126E82" />
                <circle cx="180" cy="110" r="3" fill="#126E82" />
                <circle cx="250" cy="110" r="3" fill="#126E82" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="1200" height="800" fill="url(#pcb-pattern)" />
          </svg>

          {/* Mobile pattern - simpler, larger spacing */}
          <svg className="absolute inset-0 opacity-[0.25] block md:hidden" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <defs>
              <pattern id="pcb-pattern-mobile-v2" width="400" height="400" patternUnits="userSpaceOnUse">
                {/* Fewer, simpler traces for mobile */}
                <path d="M0,50 L150,50 L180,80 L180,200 L220,240 L400,240" stroke="#1B4D80" strokeWidth="2" fill="none" />
                <path d="M50,0 L50,120 L80,150 L80,300 L120,340 L400,340" stroke="#126E82" strokeWidth="1.5" fill="none" />
                <path d="M150,0 L150,100 L180,130 L350,130 L380,160 L400,160" stroke="#1B4D80" strokeWidth="2" fill="none" />
                <path d="M0,300 L100,300 L130,330 L400,330" stroke="#126E82" strokeWidth="1.5" fill="none" />
                <path d="M250,0 L250,80 L280,110 L400,110" stroke="#1B4D80" strokeWidth="2" fill="none" />
                
                {/* Fewer solder pads */}
                <circle cx="150" cy="50" r="4" fill="#126E82" />
                <circle cx="180" cy="80" r="4" fill="#126E82" />
                <circle cx="50" cy="120" r="4" fill="#126E82" />
                <circle cx="80" cy="150" r="4" fill="#126E82" />
                <circle cx="180" cy="130" r="4" fill="#126E82" />
                <circle cx="130" cy="330" r="4" fill="#126E82" />
                <circle cx="250" cy="80" r="4" fill="#126E82" />
                <circle cx="280" cy="110" r="4" fill="#126E82" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="1200" height="800" fill="url(#pcb-pattern-mobile-v2)" />
          </svg>

          {/* PCB Circuit Traces with Animated Signals */}
          <svg className="absolute inset-0" viewBox="0 0 1200 800" preserveAspectRatio="none" id="pcb-svg">
            <defs>
              <filter id="signalGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Animated Signal Routes (invisible paths for animation) */}
            <g id="pcb-traces" stroke="none" fill="none">
              {/* Desktop routes */}
              <g className="hidden md:block">
                {/* Route 1: Top-left to center - continuous path */}
                <path id="route1" d="M0,100 L200,100 L250,150 L250,300 L400,300 L450,350 L450,450" />
                {/* Route 2: Right edge to center - continuous path */}
                <path id="route2" d="M1200,200 L1000,200 L950,250 L950,400 L800,400 L750,450 L750,550" />
                {/* Route 3: Bottom-left to center - continuous path */}
                <path id="route3" d="M0,700 L150,700 L200,650 L200,500 L350,500 L400,450 L400,350" />
                {/* Route 4: Right-bottom to center - continuous path */}
                <path id="route4" d="M1200,600 L1050,600 L1000,550 L1000,450 L850,450 L800,400 L800,300" />
                {/* Route 5: Horizontal top - continuous path */}
                <path id="route5" d="M100,50 L500,50 L550,100 L550,200 L600,250 L600,350" />
                {/* Route 6: Horizontal bottom - continuous path */}
                <path id="route6" d="M200,750 L600,750 L650,700 L650,600 L700,550 L700,450" />
              </g>

              {/* Mobile routes - simpler, fewer */}
              <g className="block md:hidden">
                {/* Route 1 mobile: Top to center */}
                <path id="route1" d="M0,80 L150,80 L180,110 L180,300 L220,340 L400,340" />
                {/* Route 2 mobile: Right to center */}
                <path id="route2" d="M800,100 L650,100 L600,150 L600,350 L550,400 L400,400" />
                {/* Route 3 mobile: Bottom to center */}
                <path id="route3" d="M0,650 L100,650 L130,680 L400,680 L450,630 L450,500" />
              </g>
            </g>

            {/* Animated Electrical Signals */}
            <g id="signals" filter="url(#signalGlow)">
              {/* Desktop signals */}
              <g className="hidden md:block">
                <circle id="signal1" r="3" fill="#64FFDA" opacity="0" />
                <circle id="signal2" r="3" fill="#64FFDA" opacity="0" />
                <circle id="signal3" r="3" fill="#64FFDA" opacity="0" />
                <circle id="signal4" r="3" fill="#64FFDA" opacity="0" />
                <circle id="signal5" r="3" fill="#64FFDA" opacity="0" />
                <circle id="signal6" r="3" fill="#64FFDA" opacity="0" />
              </g>
              {/* Mobile signals - fewer */}
              <g className="block md:hidden">
                <circle id="signal1" r="4" fill="#64FFDA" opacity="0" />
                <circle id="signal2" r="4" fill="#64FFDA" opacity="0" />
                <circle id="signal3" r="4" fill="#64FFDA" opacity="0" />
              </g>
            </g>
          </svg>
        </div>

      </div>



      {/* ── Main Content ── */}

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-8 text-center">



        {/* 3 Logos */}

        <div className="flex items-center justify-center gap-3 sm:gap-5 md:gap-8 mb-10">

          {[

            { src: "/catsu.png", alt: "CatSU Logo" },

            { src: "/icpep_logo.png", alt: "ICpEP.SE Logo", large: true },

            { src: "/cea-logo.png", alt: "CEA Logo" },

          ].map((logo) => (

            <div

              key={logo.alt}

              onClick={logo.large ? handleLogoTap : undefined}

              role={logo.large ? 'button' : undefined}

              aria-label={logo.large ? 'ICpEP.SE Logo' : undefined}

              className={`

                ${

                  logo.large

                    ? "h-20 w-20 sm:h-28 sm:w-28 md:h-36 md:w-36 scale-110 z-10 cursor-pointer"

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

          <span className="relative flex h-2.5 w-2.5">

            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />

            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-300" />

          </span>

        </div>



        {/* Main Title */}

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-5">

          Empowering Future<br />

          <span className="text-cyan-400">Computer Engineers</span>

        </h1>



        {/* Tagline */}

        <p className="max-w-xl text-base sm:text-lg text-white/70 leading-relaxed mb-2">

          The official website/web-app of ICpEP.SE CatSU Chapter

        </p>



        <p className="max-w-xl text-base sm:text-lg text-cyan-400 leading-relaxed mb-10">

          Code Blooded Engineers; Wired for the future

        </p>



        {/* Membership Notice */}
        <div className="flex items-center gap-2 mb-4">
          <Info className="h-4 w-4 text-cyan-400" />
          <span className="text-sm text-cyan-200/80">The Membership Feature Will Be Available Soon</span>
        </div>

        {/* CTA Buttons */}

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">

          <a

            href="/register"

            className="group inline-flex items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-8 py-3.5 text-[15px] font-semibold text-cyan-100 backdrop-blur transition hover:border-cyan-400/55 hover:bg-cyan-500/20 opacity-50 cursor-not-allowed pointer-events-none"

          >

            <span className="mr-2">▣</span>

            Join ICPEP.SE

            <span className="ml-2 opacity-0 transition group-hover:opacity-100">↗</span>

          </a>

          <a

            href="/login"

            className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 text-[15px] font-semibold text-white/90 backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/10 opacity-50 cursor-not-allowed pointer-events-none"

          >

            <span className="mr-2">⟶</span>

            Login as member

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

            text="The Institute of Computer Engineers of the Philippines. Student Edition – Catanduanes State University Chapter is committed in bridging the gap between industry and the academe by ensuring regional and national competitiveness of Catanduanes State University Computer Engineering Students."

            accent="#38bdf8"

          />

          <ValueCard

            title="Vision"

            text="A stronger tech community where learners thrive — producing innovative, ethically responsible, and globally competent computer engineering practitioners."

            accent="#34d399"

          />

          <ValueCard

            title="Goals"

            text="To promote the welfare, academic excellence, leadership, unity, discipline, and active participation of Computer Engineering students by fostering collaboration among members, the University, and other organizations, while supporting programs, policies, and initiatives that advance the objectives and mission of ICpEP.SE."

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