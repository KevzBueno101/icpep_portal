import { useEffect } from 'react'
import { startPCBSignals } from '../pages/landing/_pcbSignals'

export default function PCBBackground() {
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

  return (
    <div className="fixed inset-0 -z-10 h-screen w-full overflow-hidden">
      {/* Base Gradients - Updated to PCB color scheme */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'linear-gradient(135deg, #050B18 0%, #0A192F 45%, #050B18 100%)',
        }}
      />

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
  )
}
