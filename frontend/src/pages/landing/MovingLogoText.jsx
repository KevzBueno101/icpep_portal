import { useEffect, useMemo, useState } from 'react'


export default function MovingLogoText() {
  const loopItems = useMemo(
    () => [
      {
        img: '/icpep_logo.png',
        label: ' Institute of Computer Engineers of the Philippines - Student Edition ',
      },
      { img: '/cea-logo.png', label: ' College of Engineering and Architecture ' },
      { img: '/catsu.jpg', label: ' Catanduanes State University ' },
    ],
    []
  )

  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!mql) return

    const apply = () => setReducedMotion(!!mql.matches)
    apply()

    if (mql.addEventListener) {
      mql.addEventListener('change', apply)
      return () => mql.removeEventListener('change', apply)
    }

    mql.addListener(apply)
    return () => mql.removeListener(apply)
  }, [])

  return (
    <div className="w-full bg-slate-50">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-3">
        <div className="flex items-center overflow-hidden">
          <div
            className={
              reducedMotion
                ? 'flex items-center whitespace-nowrap gap-6'
                : 'flex items-center whitespace-nowrap gap-6 animate-[scroll-marquee_18s_linear_infinite]'
            }
          >
            {/* Duplicate blocks for seamless loop */}
            {Array.from({ length: 2 }).map((_, blockIdx) => (
              <div key={blockIdx} className="flex items-center gap-6">
                {loopItems.map((item, idx) => (
                  <div key={`${blockIdx}-${idx}`} className="flex items-center gap-2">
                    <img
                      src={item.img}
                      alt={item.label}
                      className="h-7 w-auto shrink-0 opacity-80 bg-transparent"
                      style={{ background: 'transparent' }}
                    />
                    <span className="text-sm font-semibold tracking-wide text-slate-400/50">
                      {item.label}
                    </span>
                  </div>
                ))}

                <span className="text-sm font-semibold tracking-wide text-slate-400/30">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

