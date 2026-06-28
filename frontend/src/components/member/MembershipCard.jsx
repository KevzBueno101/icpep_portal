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

        <h2 className="text-sm font-bold tracking-[0.2em] text-white m-0 leading-tight">
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

/* ─── Card Back (Display) ─────────────────────────────────────────────────── */

function CardBack({ qrPayload, fullName, yearText, profile, avatarInitial, onFlip }) {
  return (
    <div className="relative w-full h-full rounded-xl shadow-xl overflow-hidden select-none bg-white">
      {/* Background columns */}
      <div className="absolute inset-0 flex">
        <div className="w-[58%] h-full relative overflow-hidden" style={{ backgroundColor: COLORS.navyDark }}>
          <div
            className="absolute inset-0"
            style={{ backgroundImage: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)` }}
          />
        </div>
        <div className="w-[42%] h-full bg-white" />
      </div>

      {/* Diagonal divider */}
      <div className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
        <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(0 0, 215px 0, 250px 224px, 0 224px)', background: COLORS.navyDark }} />
        <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(215px 0, 225px 0, 260px 224px, 250px 224px)', background: COLORS.white }} />
        <div style={{ position: 'absolute', inset: 0, clipPath: 'polygon(225px 0, 240px 0, 275px 224px, 260px 224px)', background: COLORS.accentBlue }} />
      </div>

      {/* Content */}
      <div className="absolute inset-0 flex z-10 p-3.5">
        <div className="w-[62%] flex flex-col justify-between text-white pr-1">
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

          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-shrink-0">
              <div className="h-10 w-10 rounded-full overflow-hidden ring-2 ring-white/20 bg-white/5 flex items-center justify-center">
                {profile?.profile_picture ? (
                  <img src={profile.profile_picture} alt="Member" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[10px] font-black text-white">{avatarInitial}</span>
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-[11px] font-black tracking-normal uppercase whitespace-normal break-words pr-1 m-0 leading-tight">
                {fullName}
              </h1>
              <p className="text-[7.5px] font-semibold text-gray-300 uppercase tracking-normal m-0 mt-0.5">
                {profile?.course || 'BSCPE'} {yearText ? `• ${yearText}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-end justify-between gap-2.5 mt-2">
            <div className="flex-shrink-0 bg-white p-1 rounded-lg shadow-lg border border-white/10">
              <QRCodeSVG value={qrPayload} size={52} includeMargin={false} fgColor={COLORS.navyDark} />
            </div>
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

        <div className="w-[38%] flex flex-col items-end justify-between pl-1">
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
          <div className="flex flex-col items-center justify-center flex-1 w-full pb-1">
            <div className="w-34 h-34 rounded-full overflow-hidden border border-slate-200 flex items-center justify-center bg-white shadow-sm mb-2">
              <img src="/icpep_logo.jpg" alt="ICpEP Logo" className="w-full h-full object-cover" />
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

/* ─── Export Card Front (fully inline styled) ─────────────────────────────── */

function ExportCardFront() {
  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      borderRadius: 16, overflow: 'hidden',
      background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
    }}>
      {/* Geometric lines */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', opacity: 0.1,
        backgroundImage: `linear-gradient(90deg, transparent 0%, #fff 2px, transparent 2px)`,
        backgroundSize: '40px 100%',
        transform: 'rotate(28deg) scaleY(2)',
        transformOrigin: 'center',
      }} />

      <div style={{
        position: 'relative', height: '100%',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        padding: '0 24px',
      }}>
        <div style={{
          width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.2)',
          background: '#fff', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <img src="/icpep_logo.jpg" alt="ICpEP Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div style={{ color: '#fff', fontSize: 14, fontWeight: 700, letterSpacing: '0.2em', fontFamily: 'Arial, sans-serif' }}>
          ICpEP.SE
        </div>
        <div style={{ color: '#9CA3AF', fontSize: 9, fontWeight: 500, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 4, fontFamily: 'Arial, sans-serif' }}>
          Membership ID Card
        </div>
        <div style={{ color: '#6B7280', fontSize: 7, fontStyle: 'italic', marginTop: 4, fontFamily: 'Arial, sans-serif' }}>
          Valid for 1 Academic Year
        </div>
      </div>
    </div>
  )
}

/* ─── Export Card Back (fully inline styled, no Tailwind) ─────────────────── */

function ExportCardBack({ qrPayload, fullName, yearText, profile, avatarInitial }) {
  // Match display card exactly:
  // Left navy block: 58% = ~223px, right white block: 42% = ~161px
  // Diagonal: top at x=215, bottom at x=250 (35px shift over 224px height)
  const W = 384, H = 224

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      borderRadius: 16, overflow: 'hidden',
      background: COLORS.navyDark,
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* SVG background — full card size, exact polygon match to display card */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: W, height: H }}
        viewBox={`0 0 ${W} ${H}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="ng" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={COLORS.navyDark} />
            <stop offset="100%" stopColor={COLORS.navyLight} />
          </linearGradient>
        </defs>
        {/* Navy background */}
        <rect width={W} height={H} fill="url(#ng)" />
        {/* White right panel: top-left at 225, bottom-left at 260 */}
        <polygon points={`225,0 ${W},0 ${W},${H} 260,${H}`} fill="#ffffff" />
        {/* Accent blue stripe between navy and white */}
        <polygon points={`215,0 225,0 260,${H} 250,${H}`} fill={COLORS.accentBlue} />
        {/* Thin white highlight stripe */}
        <polygon points={`207,0 215,0 250,${H} 242,${H}`} fill="rgba(255,255,255,0.9)" />
      </svg>

      {/* Content overlay */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', padding: 14, zIndex: 10,
      }}>

        {/* LEFT: Navy info block — 62% width to stay within navy area */}
        <div style={{
          width: '60%', display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between', color: '#fff',
        }}>
          {/* Header text */}
          <div>
            <div style={{ fontSize: 5.5, fontWeight: 900, color: '#fff', lineHeight: 1.4, marginBottom: 1 }}>
              Institute of Computer Engineers of the Philippines
            </div>
            <div style={{ fontSize: 5.5, fontWeight: 900, color: '#fff', lineHeight: 1.4, marginBottom: 2 }}>
              Student Edition
            </div>
            <div style={{ fontSize: 4.5, fontWeight: 500, color: '#D1D5DB', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 1 }}>
              College of Engineering and Architecture
            </div>
            <div style={{ fontSize: 4, fontWeight: 700, color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Catanduanes State University
            </div>
          </div>

          {/* Profile row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
              border: '2px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {profile?.profile_picture
                ? <img src={profile.profile_picture} alt="Member" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>{avatarInitial}</span>
              }
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 900, color: '#fff', textTransform: 'uppercase', lineHeight: 1.2, wordBreak: 'break-word' }}>
                {fullName}
              </div>
              <div style={{ fontSize: 7.5, fontWeight: 600, color: '#D1D5DB', textTransform: 'uppercase', marginTop: 2 }}>
                {profile?.course || 'BSCPE'}{yearText ? ` • ${yearText}` : ''}
              </div>
            </div>
          </div>

          {/* QR + Info row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            <div style={{ background: '#fff', padding: 4, borderRadius: 8, flexShrink: 0 }}>
              <QRCodeSVG value={qrPayload} size={52} includeMargin={false} fgColor={COLORS.navyDark} />
            </div>
            <div>
              <div style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 3 }}>
                ID# {profile?.student_number || '—'}
              </div>
              <div style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 3 }}>
                Block {profile?.section || '—'}
              </div>
              <div style={{ fontSize: 7.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>
                A.Y 2025–2026
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: White seal block — push to right side */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          paddingLeft: 20,
        }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%', overflow: 'hidden',
            border: '1px solid #CBD5E1', background: '#fff', marginBottom: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/icpep_logo.jpg" alt="ICpEP Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{
            fontSize: 6, fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: '#94A3B8', textAlign: 'center',
          }}>
            Official Seal
          </div>
        </div>

      </div>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────────── */

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

      const images = exportRef.current.querySelectorAll('img')
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) return resolve()
              img.onload = resolve
              img.onerror = resolve
            })
        )
      )

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        scale: 3,
        logging: false,
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
      {/* Interactive flip card display */}
      <div className="relative w-full max-w-[384px]" style={{ perspective: '2000px' }}>
        <div
          className="relative w-full transition-transform duration-700"
          style={{ height: 224, transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        >
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

      {/* Hidden export block — fully inline styled, no Tailwind */}
      <div style={{ position: 'fixed', left: 9999, top: 0, opacity: 0, pointerEvents: 'none' }}>
        <div
          ref={exportRef}
          style={{
            width: 868,
            display: 'flex',
            flexDirection: 'row',
            gap: 48,
            padding: 40,
            background: '#f1f5f9',
            borderRadius: 24,
          }}
        >
          <div style={{ width: 384, height: 224, position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 0 1.5px #CBD5E1' }}>
            <ExportCardFront />
          </div>
          <div style={{ width: 384, height: 224, position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: '0 0 0 1.5px #CBD5E1' }}>
            <ExportCardBack
              qrPayload={qrPayload}
              fullName={fullName}
              yearText={yearText}
              profile={profile}
              avatarInitial={avatarInitial}
            />
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="mt-8 w-full max-w-[384px] space-y-3">
        <button
          type="button"
          onClick={saveAsPng}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold tracking-wide text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.99]"
        >
          {saving ? 'Processing Export...' : 'Download ID Card (PNG)'}
        </button>
      </div>
    </div>
  )
}