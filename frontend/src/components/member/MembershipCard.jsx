import { useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'

const AY_TEXT = 'Valid for AY 2025–2026'

const statusToColors = (status) => {
  const s = String(status || '').toUpperCase()
  if (s === 'APPROVED') {
    return {
      stripe: 'bg-emerald-500',
      ring: 'ring-emerald-400/30',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      badgeText: 'text-emerald-800',
      dot: 'bg-emerald-500',
      traceColor: '#34d399',
      glowColor: 'rgba(52,211,153,0.18)',
    }
  }
  if (s === 'PENDING') {
    return {
      stripe: 'bg-amber-500',
      ring: 'ring-amber-400/30',
      badgeBg: 'bg-amber-50',
      badgeBorder: 'border-amber-200',
      badgeText: 'text-amber-800',
      dot: 'bg-amber-500',
      traceColor: '#fbbf24',
      glowColor: 'rgba(251,191,36,0.18)',
    }
  }
  return {
    stripe: 'bg-rose-500',
    ring: 'ring-rose-400/30',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-800',
    dot: 'bg-rose-500',
    traceColor: '#fb7185',
    glowColor: 'rgba(251,113,133,0.18)',
  }
}

/* ─── PCB / Circuit Decorations (SVG) ─────────────────────────────────────── */

/** Animated circuit traces that run along the card edges */
function CircuitTracesSVG({ color = '#06b6d4' }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.25 }}
    >
      <defs>
        <filter id="glow-trace">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Left-side traces ── */}
      <g stroke={color} strokeWidth="1" fill="none" filter="url(#glow-trace)">
        {/* horizontal trace from left edge */}
        <polyline points="0,48 22,48 22,70 42,70" />
        <circle cx="22" cy="48" r="2" fill={color} />
        <circle cx="42" cy="70" r="2.5" fill={color} />

        {/* another trace lower-left */}
        <polyline points="0,120 18,120 18,140 55,140" />
        <circle cx="18" cy="120" r="2" fill={color} />
        <circle cx="55" cy="140" r="2.5" fill={color} />

        {/* short stub up */}
        <polyline points="18,100 18,120" />
        <circle cx="18" cy="100" r="2" fill={color} />
      </g>

      {/* ── Right-side traces ── */}
      <g stroke={color} strokeWidth="1" fill="none" filter="url(#glow-trace)">
        <polyline points="100%,55 calc(100% - 22px),55 calc(100% - 22px),80 calc(100% - 50px),80" />
        {/* workaround: use fixed coords since SVG doesn't support CSS calc */}
        {/* These will be rendered at known card dimensions ~384px wide */}
        <polyline points="384,55 362,55 362,80 330,80" />
        <circle cx="362" cy="55" r="2" fill={color} />
        <circle cx="330" cy="80" r="2.5" fill={color} />

        <polyline points="384,135 365,135 365,115 340,115" />
        <circle cx="365" cy="135" r="2" fill={color} />
        <circle cx="340" cy="115" r="2.5" fill={color} />
      </g>

      {/* ── Bottom traces ── */}
      <g stroke={color} strokeWidth="1" fill="none" filter="url(#glow-trace)">
        <polyline points="80,200 80,178 110,178" />
        <circle cx="80" cy="178" r="2" fill={color} />
        <circle cx="110" cy="178" r="2.5" fill={color} />

        <polyline points="200,200 200,182 230,182 230,168" />
        <circle cx="200" cy="182" r="2" fill={color} />
        <circle cx="230" cy="168" r="2.5" fill={color} />
      </g>
    </svg>
  )
}

/** Small IC chip widget in the corner */
function ICChip({ style, color = '#06b6d4' }) {
  return (
    <svg
      width="34"
      height="26"
      viewBox="0 0 34 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.3, ...style }}
    >
      {/* chip body */}
      <rect x="6" y="4" width="22" height="18" rx="2" stroke={color} strokeWidth="1.2" />
      {/* centre die mark */}
      <rect x="11" y="9" width="12" height="8" rx="1" stroke={color} strokeWidth="0.8" />
      <line x1="17" y1="9" x2="17" y2="17" stroke={color} strokeWidth="0.6" strokeDasharray="1.5 1.5" />
      <line x1="11" y1="13" x2="23" y2="13" stroke={color} strokeWidth="0.6" strokeDasharray="1.5 1.5" />
      {/* pin 1 marker dot */}
      <circle cx="8.5" cy="6.5" r="1" fill={color} />
      {/* left pins */}
      <line x1="0" y1="8" x2="6" y2="8" stroke={color} strokeWidth="1.2" />
      <line x1="0" y1="13" x2="6" y2="13" stroke={color} strokeWidth="1.2" />
      <line x1="0" y1="18" x2="6" y2="18" stroke={color} strokeWidth="1.2" />
      {/* right pins */}
      <line x1="28" y1="8" x2="34" y2="8" stroke={color} strokeWidth="1.2" />
      <line x1="28" y1="13" x2="34" y2="13" stroke={color} strokeWidth="1.2" />
      <line x1="28" y1="18" x2="34" y2="18" stroke={color} strokeWidth="1.2" />
    </svg>
  )
}

/** Solder-point decorations cluster */
function SolderDots({ style, color = '#06b6d4' }) {
  const dots = [
    [0, 0], [10, 0], [20, 0],
    [5, 8], [15, 8],
    [0, 16], [10, 16],
  ]
  return (
    <svg
      width="24"
      height="20"
      viewBox="0 0 24 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.2, ...style }}
    >
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x + 2} cy={y + 2} r="1.8" fill={color} />
      ))}
    </svg>
  )
}

/** Scanline overlay for CRT / tech feel */
function ScanlineOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.07) 3px, rgba(0,0,0,0.07) 4px)',
        mixBlendMode: 'multiply',
      }}
    />
  )
}

/* ─── Card Front ──────────────────────────────────────────────────────────── */

function CardFront({
  profile,
  colors,
  fullName,
  yearText,
  memberSinceText,
  chapterName,
  avatarInitial,
  onFlip,
}) {
  return (
    <div className="relative w-full h-full rounded-2xl ring-1 ring-white/10 shadow-xl overflow-hidden">
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#050c18] via-[#071426] to-[#050d1f]" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.20) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          mixBlendMode: 'screen',
        }}
      />

      {/* Scanlines */}
      <ScanlineOverlay />

      {/* Logo background */}
      <div
        className="absolute inset-0 bg-no-repeat bg-right bg-contain opacity-10 pointer-events-none"
        style={{ backgroundImage: "url('/icpep_logo.png')" }}
      />

      {/* Top stripe */}
      <div className={`h-2 w-full ${colors.stripe}`} />

      <div className="relative h-full px-4 py-4 flex flex-col justify-between">
        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/icpep_logo.png"
              alt="ICPEP.SE | CatSU Chapter"
              className="h-12 w-12 rounded-xl ring-1 ring-white/20 bg-white/5"
            />
            <div>
              <div className="text-[10px] font-semibold tracking-wide text-white/70">ICPEP.SE</div>
              <div className="text-xs font-bold text-white">Membership ID</div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${colors.badgeBg} ${colors.badgeBorder} ${colors.badgeText} bg-opacity-90`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
              {String(profile?.membership_status || 'PENDING').toUpperCase() === 'APPROVED'
                ? 'VERIFIED'
                : String(profile?.membership_status || 'PENDING').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Profile row */}
        <div className="mt-2 flex items-center gap-3">
          <div className="relative">
            <div
              className={`h-12 w-12 rounded-full overflow-hidden ring-2 ring-white/10 ${colors.ring}`}
            >
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-white/5">
                  <span className="text-sm font-extrabold text-white">{avatarInitial}</span>
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-base font-extrabold text-white leading-normal py-0.5 truncate">
              {fullName}
            </div>
            <div className="mt-0.5 text-[10px] font-medium text-white/70">
              Student No.
              <span className="ml-1.5 font-mono tracking-wide text-white">
                {profile?.student_number || '—'}
              </span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="mt-2">
          <div className="text-xs font-semibold text-white/90">
            {profile?.course || '—'} • {yearText || '—'} • {profile?.section || '—'}
          </div>
          <div className="mt-0.5 text-[10px] text-white/60">
            {memberSinceText} • {chapterName}
          </div>
        </div>
      </div>

      {/* Flip button */}
      {onFlip && (
        <button
          type="button"
          onClick={onFlip}
          className="absolute right-3 top-3 rounded-xl bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/70 ring-1 ring-white/10 hover:bg-white/10"
        >
          Flip
        </button>
      )}
    </div>
  )
}

/* ─── Card Back ───────────────────────────────────────────────────────────── */

function CardBack({
  qrPayload,
  colors,
  paymentBadge,
  profile,
  paymentMethod,
  onFlip,
}) {
  return (
    <div className="relative w-full h-full rounded-2xl ring-1 ring-white/10 shadow-xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050c18] via-[#071426] to-[#050d1f]" />
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.20) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.20) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          mixBlendMode: 'screen',
        }}
      />

      <ScanlineOverlay />

      {/* Logo background */}
      <div
        className="absolute inset-0 bg-no-repeat bg-right bg-contain opacity-20 pointer-events-none"
        style={{ backgroundImage: "url('/icpep_logo.jpg')" }}
      />

      {/* IC chip – bottom-right */}
      <ICChip
        color={colors.traceColor}
        style={{ position: 'absolute', bottom: 14, right: 12, pointerEvents: 'none' }}
      />

      {/* Solder dots – top-left */}
      <SolderDots
        color={colors.traceColor}
        style={{ position: 'absolute', top: 22, left: 10, pointerEvents: 'none' }}
      />

      <div className={`h-2 w-full ${colors.stripe}`} />

      <div className="relative h-full px-4 py-4 flex flex-col justify-between">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">Verification</div>
            <div className="text-xs font-bold text-white mt-1">Scan to verify membership</div>
          </div>
          {onFlip && (
            <button
              type="button"
              onClick={onFlip}
              className="rounded-xl bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/70 ring-1 ring-white/10 hover:bg-white/10"
            >
              Flip
            </button>
          )}
        </div>

        <div className="mt-2 flex flex-1 items-center justify-between gap-3">
          <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-2">
            <div className="text-[9px] font-semibold text-white/60 mb-1">QR</div>
            <div className="bg-white rounded-md p-1">
              <QRCodeSVG value={qrPayload} size={66} includeMargin={false} />
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
            <div>
              <div className="text-[10px] font-semibold text-white/60">{AY_TEXT}</div>
              <div className="mt-1 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] font-bold text-white">
                {paymentBadge}
              </div>
            </div>

            {paymentMethod === 'GCASH' ? (
              <div className="text-[9px] text-white/70">GCash proof required for renewal.</div>
            ) : <div className="text-[9px] text-white/70">Note: This membership ID is valid even without signature.</div>
            }

            <div className="text-[9px] text-white/50">
              Student No:{' '}
              <span className="font-mono text-white/70">{profile?.student_number || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Export ─────────────────────────────────────────────────────────── */

export default function MembershipCard({ profile, userId, paymentMethod }) {
  const exportRef = useRef(null)
  const [flipped, setFlipped] = useState(false)
  const [saving, setSaving] = useState(false)

  const status = profile?.membership_status
  const colors = statusToColors(status)

  const fullName =
    [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ') || '—'

  const yearText = useMemo(() => {
    const map = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' }
    const v = String(profile?.year_level ?? '')
    return map[v] || profile?.year_level || ''
  }, [profile?.year_level])

  const qrPayload = useMemo(() => {
    const sn = profile?.student_number || ''
    const uid = userId || profile?.user || ''
    const section = profile?.section || '—'
    return `${sn}|${fullName}|${yearText}|${section}|${status || ''}|${uid}`
  }, [profile, userId, fullName, yearText, status])

  const chapterName = 'Institute of Computer Engineers of the Philippines. Student Edition'
  const memberSince = profile?.created_at ? new Date(profile.created_at) : null
  const memberSinceText = memberSince
    ? memberSince.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—'

  const paymentBadge = paymentMethod === 'GCASH' ? 'GCash' : 'On-hand'
  const avatarInitial = String(profile?.first_name || '?').slice(0, 1).toUpperCase()

  const saveAsPng = async () => {
    if (!exportRef.current) return
    try {
      setSaving(true)
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: null,
        useCORS: true,
        scale: 2,
      })
      const a = document.createElement('a')
      a.href = canvas.toDataURL('image/png')
      a.download = `ICPEP_ID_${profile?.student_number || 'member'}.png`
      a.click()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full">
      {/* 1. Flippable card (screen display) */}
      <div className="relative mx-auto w-full max-w-sm" style={{ perspective: '1200px' }}>
        <div className="relative w-full" style={{ height: 200 }}>
          <div
            className="absolute inset-0 transition-transform duration-600"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front */}
            <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden' }}>
              <CardFront
                profile={profile}
                colors={colors}
                fullName={fullName}
                yearText={yearText}
                memberSinceText={memberSinceText}
                chapterName={chapterName}
                avatarInitial={avatarInitial}
                onFlip={() => setFlipped(true)}
              />
            </div>
            {/* Back */}
            <div className="absolute inset-0" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
              <CardBack
                qrPayload={qrPayload}
                colors={colors}
                paymentBadge={paymentBadge}
                profile={profile}
                paymentMethod={paymentMethod}
                onFlip={() => setFlipped(false)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Hidden export container (front + back side-by-side) */}
      <div
        ref={exportRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '832px',
          display: 'flex',
          flexDirection: 'row',
          gap: '24px',
          padding: '20px',
          background: '#050c18',
          borderRadius: '16px',
        }}
      >
        <div style={{ width: '384px', height: '200px', position: 'relative' }}>
          <CardFront
            profile={profile}
            colors={colors}
            fullName={fullName}
            yearText={yearText}
            memberSinceText={memberSinceText}
            chapterName={chapterName}
            avatarInitial={avatarInitial}
          />
        </div>
        <div style={{ width: '384px', height: '200px', position: 'relative' }}>
          <CardBack
            qrPayload={qrPayload}
            colors={colors}
            paymentBadge={paymentBadge}
            profile={profile}
            paymentMethod={paymentMethod}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex items-center justify-center">
        <button
          type="button"
          onClick={saveAsPng}
          disabled={saving}
          className="inline-flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 shadow-sm hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Generating ID PNG...' : 'Download ID Card (PNG)'}
        </button>
      </div>

      <div className="mt-1 text-center text-xs text-slate-500">Tip: tap the card to flip.</div>
    </div>
  )
}
