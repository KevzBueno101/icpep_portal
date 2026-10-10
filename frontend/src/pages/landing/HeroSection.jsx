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

  const [pinnedAnnouncements, setPinnedAnnouncements] = useState([])

  const [loading, setLoading] = useState(true)



  // Particles disabled as per requirements - using PCB signals instead
  // useEffect(() => {
  //   const canvas = canvasRef.current
  //   if (!canvas) return
  //   const stop = startHeroParticles(canvas, { accent: '#06B6D4' })
  //   return () => stop && stop()
  // }, [])



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