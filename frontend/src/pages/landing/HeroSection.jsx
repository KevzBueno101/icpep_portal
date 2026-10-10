import { useEffect, useRef, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { Info } from 'lucide-react'

import { startHeroParticles } from './_heroParticles'

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



  useEffect(() => {

    const canvas = canvasRef.current

    if (!canvas) return

    const stop = startHeroParticles(canvas, { accent: '#06B6D4' })

    return () => stop && stop()

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

          {/* Circuit trace pattern */}
          <svg className="absolute inset-0 opacity-[0.12]" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <defs>
              <pattern id="circuit" width="200" height="200" patternUnits="userSpaceOnUse">
                {/* Bus-style parallel traces (thicker) */}
                <line x1="0" y1="20" x2="120" y2="20" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
                <line x1="0" y1="26" x2="120" y2="26" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
                <line x1="0" y1="32" x2="120" y2="32" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
                
                <line x1="80" y1="170" x2="200" y2="170" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
                <line x1="80" y1="176" x2="200" y2="176" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
                <line x1="80" y1="182" x2="200" y2="182" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
                
                {/* Vertical bus traces */}
                <line x1="170" y1="0" x2="170" y2="100" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
                <line x1="176" y1="0" x2="176" y2="100" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
                <line x1="182" y1="0" x2="182" y2="100" stroke="rgba(6,182,212,0.7)" strokeWidth="2" />
                
                {/* Horizontal signal traces (thinner) */}
                <line x1="0" y1="60" x2="70" y2="60" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                <line x1="130" y1="60" x2="200" y2="60" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                <line x1="0" y1="100" x2="50" y2="100" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                <line x1="150" y1="100" x2="200" y2="100" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                <line x1="0" y1="140" x2="200" y2="140" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                
                {/* Vertical signal traces */}
                <line x1="30" y1="0" x2="30" y2="80" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                <line x1="30" y1="120" x2="30" y2="200" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                <line x1="90" y1="0" x2="90" y2="60" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                <line x1="90" y1="140" x2="90" y2="200" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                <line x1="140" y1="40" x2="140" y2="160" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                
                {/* Diagonal traces at various angles */}
                <line x1="50" y1="50" x2="90" y2="90" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
                <line x1="110" y1="110" x2="150" y2="150" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
                <line x1="150" y1="50" x2="110" y2="90" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
                <line x1="50" y1="150" x2="90" y2="110" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
                
                {/* T-junctions */}
                <line x1="70" y1="60" x2="70" y2="90" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                <line x1="50" y1="90" x2="90" y2="90" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                
                <line x1="130" y1="100" x2="130" y2="130" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                <line x1="110" y1="130" x2="150" y2="130" stroke="rgba(6,182,212,0.5)" strokeWidth="1" />
                
                {/* Vias (connection points) */}
                <circle cx="30" cy="60" r="2.5" fill="rgba(6,182,212,0.8)" />
                <circle cx="70" cy="60" r="2.5" fill="rgba(6,182,212,0.8)" />
                <circle cx="130" cy="60" r="2.5" fill="rgba(6,182,212,0.8)" />
                <circle cx="170" cy="60" r="2.5" fill="rgba(6,182,212,0.8)" />
                <circle cx="70" cy="90" r="2.5" fill="rgba(6,182,212,0.8)" />
                <circle cx="90" cy="90" r="2.5" fill="rgba(6,182,212,0.8)" />
                <circle cx="130" cy="100" r="2.5" fill="rgba(6,182,212,0.8)" />
                <circle cx="130" cy="130" r="2.5" fill="rgba(6,182,212,0.8)" />
                <circle cx="150" cy="130" r="2.5" fill="rgba(6,182,212,0.8)" />
                <circle cx="140" cy="140" r="2.5" fill="rgba(6,182,212,0.8)" />
              </pattern>
            </defs>
            <rect x="0" y="0" width="1200" height="800" fill="url(#circuit)" />
          </svg>

          {/* IC Chips with pulse animation */}
          <svg className="absolute inset-0" viewBox="0 0 1200 800" preserveAspectRatio="none">
            <defs>
              <filter id="chipGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="pulseGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Chip 1 - Left Side Top */}
            <g transform="translate(80, 250)">
              <rect x="-25" y="-25" width="50" height="50" fill="rgba(15,23,42,0.8)" stroke="rgba(6,182,212,0.6)" strokeWidth="2" filter="url(#chipGlow)">
                <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="3s" repeatCount="indefinite" />
              </rect>
              {/* Pins */}
              {[...Array(6)].map((_, i) => (
                <line key={`l-${i}`} x1="-25" y1={-20 + i * 8} x2="-30" y2={-20 + i * 8} stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
              ))}
              {[...Array(6)].map((_, i) => (
                <line key={`r-${i}`} x1="25" y1={-20 + i * 8} x2="30" y2={-20 + i * 8} stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
              ))}
              <text x="0" y="5" textAnchor="middle" fill="rgba(6,182,212,0.8)" fontSize="10" fontWeight="bold">MCU</text>
            </g>

            {/* Chip 2 - Left Side Bottom */}
            <g transform="translate(80, 550)">
              <rect x="-20" y="-20" width="40" height="40" fill="rgba(15,23,42,0.8)" stroke="rgba(6,182,212,0.6)" strokeWidth="2" filter="url(#chipGlow)">
                <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="2.5s" repeatCount="indefinite" />
              </rect>
              {[...Array(5)].map((_, i) => (
                <line key={`l-${i}`} x1="-20" y1={-15 + i * 7.5} x2="-25" y2={-15 + i * 7.5} stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
              ))}
              {[...Array(5)].map((_, i) => (
                <line key={`r-${i}`} x1="20" y1={-15 + i * 7.5} x2="25" y2={-15 + i * 7.5} stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" />
              ))}
              <text x="0" y="5" textAnchor="middle" fill="rgba(6,182,212,0.8)" fontSize="9" fontWeight="bold">CPU</text>
            </g>

            {/* Chip 3 - Right Side Top */}
            <g transform="translate(1120, 280)">
              <rect x="-30" y="-20" width="60" height="40" fill="rgba(15,23,42,0.8)" stroke="rgba(124,58,237,0.6)" strokeWidth="2" filter="url(#chipGlow)">
                <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="4s" repeatCount="indefinite" />
              </rect>
              {[...Array(5)].map((_, i) => (
                <line key={`l-${i}`} x1="-30" y1={-15 + i * 7.5} x2="-35" y2={-15 + i * 7.5} stroke="rgba(124,58,237,0.5)" strokeWidth="1.5" />
              ))}
              {[...Array(5)].map((_, i) => (
                <line key={`r-${i}`} x1="30" y1={-15 + i * 7.5} x2="35" y2={-15 + i * 7.5} stroke="rgba(124,58,237,0.5)" strokeWidth="1.5" />
              ))}
              <text x="0" y="5" textAnchor="middle" fill="rgba(124,58,237,0.8)" fontSize="10" fontWeight="bold">IC-01</text>
            </g>

            {/* Chip 4 - Right Side Bottom */}
            <g transform="translate(1120, 520)">
              <rect x="-22" y="-22" width="44" height="44" fill="rgba(15,23,42,0.8)" stroke="rgba(124,58,237,0.6)" strokeWidth="2" filter="url(#chipGlow)">
                <animate attributeName="stroke-opacity" values="0.6;1;0.6" dur="3.5s" repeatCount="indefinite" />
              </rect>
              {[...Array(5)].map((_, i) => (
                <line key={`l-${i}`} x1="-22" y1={-17 + i * 8.5} x2="-27" y2={-17 + i * 8.5} stroke="rgba(124,58,237,0.5)" strokeWidth="1.5" />
              ))}
              {[...Array(5)].map((_, i) => (
                <line key={`r-${i}`} x1="22" y1={-17 + i * 8.5} x2="27" y2={-17 + i * 8.5} stroke="rgba(124,58,237,0.5)" strokeWidth="1.5" />
              ))}
              <text x="0" y="5" textAnchor="middle" fill="rgba(124,58,237,0.8)" fontSize="9" fontWeight="bold">IC-02</text>
            </g>

            {/* Programming Language Logos - Low Opacity */}
            <g opacity="0.08">
              {/* Python Logo (simplified snakes) */}
              <g transform="translate(400, 350)">
                <path d="M-20,-15 Q-35,-15 -35,0 Q-35,15 -20,15 L-10,15 L-10,5 L-20,5 Q-25,5 -25,0 Q-25,-5 -20,-5 L10,-5 L10,-15 Z" fill="rgba(59,130,246,0.8)" />
                <path d="M20,15 Q35,15 35,0 Q35,-15 20,-15 L10,-15 L10,-5 L20,-5 Q25,-5 25,0 Q25,5 20,5 L-10,5 L-10,15 Z" fill="rgba(251,146,60,0.8)" />
                <circle cx="-15" cy="-10" r="3" fill="rgba(59,130,246,0.8)" />
                <circle cx="15" cy="10" r="3" fill="rgba(251,146,60,0.8)" />
              </g>

              {/* C++ Logo */}
              <g transform="translate(800, 350)">
                <text x="0" y="0" textAnchor="middle" fill="rgba(59,130,246,0.8)" fontSize="48" fontWeight="bold" fontFamily="monospace">C++</text>
              </g>
            </g>

            {/* Networking Elements - Cables and Connectors */}
            <g opacity="0.15">
              {/* Network cable traces at bottom */}
              <g transform="translate(0, 720)">
                {/* Cable bundle 1 - Left */}
                <line x1="100" y1="0" x2="100" y2="40" stroke="rgba(6,182,212,0.6)" strokeWidth="3" />
                <line x1="108" y1="0" x2="108" y2="40" stroke="rgba(6,182,212,0.6)" strokeWidth="3" />
                <line x1="116" y1="0" x2="116" y2="40" stroke="rgba(6,182,212,0.6)" strokeWidth="3" />
                <line x1="124" y1="0" x2="124" y2="40" stroke="rgba(6,182,212,0.6)" strokeWidth="3" />
                {/* RJ45 connector */}
                <rect x="90" y="40" width="44" height="25" fill="rgba(15,23,42,0.9)" stroke="rgba(6,182,212,0.6)" strokeWidth="2" rx="3" />
                <line x1="98" y1="50" x2="98" y2="60" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
                <line x1="106" y1="50" x2="106" y2="60" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
                <line x1="114" y1="50" x2="114" y2="60" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
                <line x1="122" y1="50" x2="122" y2="60" stroke="rgba(6,182,212,0.4)" strokeWidth="1" />
              </g>

              {/* Cable bundle 2 - Right */}
              <g transform="translate(0, 720)">
                <line x1="1050" y1="0" x2="1050" y2="40" stroke="rgba(124,58,237,0.6)" strokeWidth="3" />
                <line x1="1058" y1="0" x2="1058" y2="40" stroke="rgba(124,58,237,0.6)" strokeWidth="3" />
                <line x1="1066" y1="0" x2="1066" y2="40" stroke="rgba(124,58,237,0.6)" strokeWidth="3" />
                <line x1="1074" y1="0" x2="1074" y2="40" stroke="rgba(124,58,237,0.6)" strokeWidth="3" />
                {/* RJ45 connector */}
                <rect x="1040" y="40" width="44" height="25" fill="rgba(15,23,42,0.9)" stroke="rgba(124,58,237,0.6)" strokeWidth="2" rx="3" />
                <line x1="1048" y1="50" x2="1048" y2="60" stroke="rgba(124,58,237,0.4)" strokeWidth="1" />
                <line x1="1056" y1="50" x2="1056" y2="60" stroke="rgba(124,58,237,0.4)" strokeWidth="1" />
                <line x1="1064" y1="50" x2="1064" y2="60" stroke="rgba(124,58,237,0.4)" strokeWidth="1" />
                <line x1="1072" y1="50" x2="1072" y2="60" stroke="rgba(124,58,237,0.4)" strokeWidth="1" />
              </g>

              {/* Network topology nodes */}
              <g transform="translate(300, 680)">
                <circle cx="0" cy="0" r="8" fill="rgba(6,182,212,0.6)" />
                <circle cx="100" cy="-30" r="6" fill="rgba(6,182,212,0.5)" />
                <circle cx="100" cy="30" r="6" fill="rgba(6,182,212,0.5)" />
                <circle cx="200" cy="0" r="8" fill="rgba(6,182,212,0.6)" />
                <line x1="0" y1="0" x2="100" y2="-30" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
                <line x1="0" y1="0" x2="100" y2="30" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
                <line x1="100" y1="-30" x2="200" y2="0" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
                <line x1="100" y1="30" x2="200" y2="0" stroke="rgba(6,182,212,0.4)" strokeWidth="1.5" />
              </g>

              <g transform="translate(900, 680)">
                <circle cx="0" cy="0" r="8" fill="rgba(124,58,237,0.6)" />
                <circle cx="-80" cy="-20" r="6" fill="rgba(124,58,237,0.5)" />
                <circle cx="-80" cy="20" r="6" fill="rgba(124,58,237,0.5)" />
                <line x1="0" y1="0" x2="-80" y2="-20" stroke="rgba(124,58,237,0.4)" strokeWidth="1.5" />
                <line x1="0" y1="0" x2="-80" y2="20" stroke="rgba(124,58,237,0.4)" strokeWidth="1.5" />
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