import { useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'

const COLORS = {
  navyDark: '#03152B',
  navyLight: '#071F3D',
  accentBlue: '#0C2D54',
  white: '#FFFFFF',
  textGray: '#7E91A6',
}

function GeometricLines() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
      <div 
        className="absolute w-full h-[200%] top-[-50%] left-[20%] rotate-[28deg]"
        style={{
          backgroundImage: `linear-gradient(90deg, transparent 0%, ${COLORS.white} 2px, transparent 2px)`,
          backgroundSize: '40px 100%',
        }}
      />
    </div>
  )
}

/* ─── Card Front ──────────────────────────────────────────────────────────── */

function CardFront({ onFlip }) {
  return (
    <div className="relative w-full h-full rounded-xl shadow-xl overflow-hidden select-none" style={{ backgroundColor: COLORS.navyDark }}>
      <div 
        className="absolute inset-0" 
        style={{ backgroundImage: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)` }}
      />
      <GeometricLines />

      <div className="relative h-full px-6 flex flex-col items-center justify-center text-center">
        <div className="mb-3 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full overflow-hidden border border-white/20 flex items-center justify-center bg-white shadow-md">
            <img 
              src="/icpep_logo.jpg" 
              alt="ICpEP Logo" 
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        </div>

        <h2 className="text-sm font-bold tracking-[0.2em] text-white  m-0 leading-tight">
          ICpEP.SE
        </h2>
        <p className="text-[9px] font-medium tracking-[0.15em] text-gray-400 uppercase mt-1 mb-0">
          Membership ID Card
        </p>
        <em className="text-[5px] font-medium tracking-[0.15em] text-gray-500 mt-1 mb-0">
          Valid for 1 Academic Year
        </em>
      </div>

      {onFlip && (
        <button
          type="button"
          onClick={onFlip}
          className="absolute right-3 top-3 z-10 rounded-lg bg-white/5 px-2.5 py-1 text-[9px] font-semibold text-white/80 border border-white/10 hover:bg-white/10 active:scale-95 transition-all"
        >
          Flip Card
        </button>
      )}
    </div>
  )
}

/* ─── Card Back ───────────────────────────────────────────────────────────── */

function CardBack({
  qrPayload,
  fullName,
  yearText,
  profile,
  avatarInitial,
  onFlip,
}) {
  return (
    <div className="relative w-full h-full rounded-xl shadow-xl overflow-hidden select-none bg-white">
      {/* Dynamic Background Layout Columns */}
      <div className="absolute inset-0 flex">
        <div className="w-[58%] h-full relative overflow-hidden" style={{ backgroundColor: COLORS.navyDark }}>
          <div 
            className="absolute inset-0" 
            style={{ backgroundImage: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)` }}
          />
        </div>
        <div className="w-[42%] h-full bg-white" />
      </div>

      {/* Asymmetric Structural Geometric Vectors */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 384 224" preserveAspectRatio="none">
        <polygon points="0,0 215,0 250,224 0,224" fill={COLORS.navyDark} />
        <polygon points="215,0 225,0 260,224 250,224" fill={COLORS.white} />
        <polygon points="225,0 240,0 275,224 260,224" fill={COLORS.accentBlue} />
      </svg>

      {/* Interactive Interface Elements Overlay Grid */}
      <div className="absolute inset-0 flex z-10 p-3.5">
        
        {/* Navy Left Block Layer - Information Hierarchy */}
        <div className="w-[62%] flex flex-col justify-between text-white pr-1">
          
          {/* Top Multi-Line Institutional Headers */}
          <div className="space-y-0.5 mt-0.5">
            <div className="flex flex-col items-start gap-1">
              <h3 className="text-[5.5px] font-black tracking-wide text-white leading-tight m-0 opacity-95">
                Institute of Computer Engineers of the Philippines
              </h3>
              <h5 className="text-[5.5px] font-black tracking-wide text-white leading-tight m-0 opacity-95">
                Student Edition
              </h5>
            </div>
            <p className="text-[4.5px] font-medium text-gray-300 uppercase tracking-wider leading-none m-0 opacity-80">
              College of Engineering and Architecture
            </p>
            <p className="text-[3.5px] font-bold text-blue-400 uppercase tracking-wider leading-none m-0 opacity-90">
              Catanduanes State University
            </p>
          </div>

          {/* Relocated Profile Meta-Row (Now positioned cleanly below header) */}
          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/20 bg-white/5 flex items-center justify-center">
                {profile?.profile_picture ? (
                  <img
                    src={profile.profile_picture}
                    alt="Member Content"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[10px] font-black text-white">{avatarInitial}</span>
                )}
              </div>
            </div>
            
            <div className="min-w-0 flex-1">
              {/* PINALITAN: Tinanggal ang truncate, pinalitan ng pr-1 at normal wrap para sa techno fonts */}
              <h1 className="text-[11px] font-black tracking-normal uppercase whitespace-normal break-words pr-1 m-0 leading-tight">
                {fullName}
              </h1>
              {/* PINALITAN: Tinanggal ang truncate para hindi mag-cut ang character box */}
              <p className="text-[7.5px] font-semibold text-gray-300 uppercase tracking-normal m-0 mt-0.5">
                {profile?.course || 'BSCPE'} {yearText ? `• ${yearText}` : ''}
              </p>
            </div>
          </div>

          {/* Bottom Row Layout: Verification QR Frame + Badges */}
          <div className="flex items-end justify-between gap-2.5 mt-2">
            <div className="flex-shrink-0 bg-white p-1 rounded-lg shadow-lg border border-white/10">
              <QRCodeSVG 
                value={qrPayload} 
                size={52} 
                includeMargin={false}
                fgColor={COLORS.navyDark}
              />
            </div>

            {/* Custom Circular Data Node Layout */}
            <div className="flex-1 space-y-0.5 font-mono text-[7.5px] tracking-wide text-white/90 pb-0.5">
              <div className="flex items-center gap-1.5">
                <span className="tracking-normal font-sans font-bold">ID# {profile?.student_number || '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="tracking-normal font-sans font-bold">Block {profile?.section || '—'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="tracking-normal font-sans font-bold">A.Y 2025–2026</span>
              </div>
            </div>
          </div>

        </div>

        {/* White Right Block Layer - Controls + Brand Asset Placement */}
        <div className="w-[38%] flex flex-col items-end justify-between pl-1">
          {/* Flip Toggle Button Action Container */}
          <div className="h-5 flex items-start">
            {onFlip && (
              <button
                type="button"
                onClick={onFlip}
                className="rounded-lg bg-slate-900/5 px-2 py-0.5 text-[8px] font-bold text-slate-700 border border-slate-200/80 hover:bg-slate-900/10 active:scale-95 transition-all"
              >
                Flip
              </button>
            )}
          </div>

          {/* Right White Column Brand Asset Layout Area */}
          <div className="flex flex-col items-center justify-center flex-1 w-full pb-1">
            <div className="w-34 h-34 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-white shadow-sm mb-2">
              <img 
                src="/icpep_logo.jpg" 
                alt="ICpEP Logo" 
                className="w-full h-full object-cover" 
              />
            </div>
            <span className="text-[6.5px] font-black uppercase tracking-widest text-slate-400 text-center block">
              Official Seal
            </span>
          </div>
        </div>

      </div>
    </div>
  )
}

/* ─── Main Interface Wrapper Component ────────────────────────────────────── */

export default function MembershipCard({ profile, userId }) {
  const exportRef = useRef(null)
  const [flipped, setFlipped] = useState(false)
  const [saving, setSaving] = useState(false)

  const fullName = useMemo(() => {
    return [profile?.first_name, profile?.middle_name, profile?.last_name]
      .filter(Boolean)
      .join(' ') || 'Authorized Member'
  }, [profile])

  const yearText = useMemo(() => {
    const map = { '1': '1st Yr', '2': '2nd Yr', '3': '3rd Yr', '4': '4th Yr' }
    const v = String(profile?.year_level ?? '')
    return map[v] || profile?.year_level || ''
  }, [profile?.year_level])

  const qrPayload = useMemo(() => {
    const sn = profile?.student_number || ''
    const uid = userId || profile?.user || ''
    const section = profile?.section || '—'
    return `ICPEP|${sn}|${fullName}|${section}|${uid}`
  }, [profile, userId, fullName])

  const avatarInitial = String(profile?.first_name || '?').slice(0, 1).toUpperCase()

  const saveAsPng = async () => {
    if (!exportRef.current) return
    try {
      setSaving(true)
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: null,
        useCORS: true,
        scale: 3,
      })
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `ICpEP_Card_${profile?.student_number || 'member'}.png`
      a.click()
    } catch (err) {
      console.error('Canvas processing error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* Interactive Display Area */}
      <div className="relative w-full max-w-[384px]" style={{ perspective: '2000px' }}>
        <div className="relative w-full transition-transform duration-700" style={{ height: 224, transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          
          <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
            <CardFront onFlip={() => setFlipped(true)} />
          </div>
          
          <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <CardBack
              qrPayload={qrPayload}
              fullName={fullName}
              yearText={yearText}
              profile={profile}
              avatarInitial={avatarInitial}
              onFlip={() => setFlipped(false)}
            />
          </div>

        </div>
      </div>

      {/* Hidden Layout Block Used For Image Generation Engine */}
      <div className="absolute top-[-9999px] left-[-9999px] pointer-events-none">
        <div 
          ref={exportRef}
          style={{
            width: '816px',
            display: 'flex',
            flexDirection: 'row',
            gap: '48px',
            padding: '40px',
            background: '#010914',
            borderRadius: '24px',
          }}
        >
          <div style={{ width: '384px', height: '224px', position: 'relative' }}>
            <CardFront />
          </div>
          <div style={{ width: '384px', height: '224px', position: 'relative' }}>
            <CardBack 
              qrPayload={qrPayload} 
              fullName={fullName} 
              yearText={yearText} 
              profile={profile} 
              avatarInitial={avatarInitial} 
            />
          </div>
        </div>
      </div>

      {/* Interface Control Section */}
      <div className="mt-8 w-full max-w-[384px] space-y-3">
        <button
          type="button"
          onClick={saveAsPng}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold tracking-wide text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.99]"
        >
          {saving ? 'Processing Export Buffers...' : 'Download ID Card (PNG)'}
        </button>
      </div>
    </div>
  )
}