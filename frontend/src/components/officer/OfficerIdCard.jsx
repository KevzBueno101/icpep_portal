import { useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'

const C = {
  navy:       '#0B1830',
  navyLight:  '#132244',
  royal:      '#1C3B6B',
  accent:     '#2B7BE4',
  cyan:       '#0BC5EA',
  white:      '#FFFFFF',
  silver:     '#E2E8F0',
  slate:      '#475569',
  cardBg:     '#F8FAFC',
}

const CARD_W = 300
const CARD_H = 480

/* ─── Decorative diagonal accent bar ───────────────────────────────────── */

function DiagonalBar({ className = '' }) {
  return (
    <svg className={`absolute ${className}`} width="100%" height="100%" viewBox={`0 0 ${CARD_W} ${CARD_H}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <clipPath id="diagonalClip">
        <polygon points={`0,0 ${CARD_W},0 ${CARD_W},0 0,${Math.round(CARD_H * 0.38)}`} />
      </clipPath>
    </svg>
  )
}

/* ─── Display Card ─────────────────────────────────────────────────────── */

function DisplayCard({ qrPayload, fullName, position, yearText, officerId, profilePictureUrl, avatarInitial }) {
  return (
    <div
      className="relative w-full overflow-hidden rounded-[28px] shadow-[0_24px_64px_-12px_rgba(11,24,48,0.45)] select-none"
      style={{ maxWidth: CARD_W, height: CARD_H, background: C.white }}
    >
      {/* ── Top navy block with diagonal cut ── */}
      <div className="absolute inset-x-0 top-0" style={{ height: '44%' }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyLight} 40%, ${C.royal} 100%)`,
            clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 ${Math.round(CARD_H * 0.44)}px)`,
          }}
        />
        {/* Diagonal accent stripe */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, transparent 58%, ${C.accent}20 58%, ${C.accent}40 62%, transparent 62%)`,
            clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 ${Math.round(CARD_H * 0.44)}px)`,
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 ${Math.round(CARD_H * 0.44)}px)`,
          }}
        />
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full opacity-20" style={{ border: `1.5px solid ${C.white}`, clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 ${Math.round(CARD_H * 0.44)}px)` }} />
        <div className="absolute bottom-[15%] -left-4 h-16 w-16 rounded-full opacity-15" style={{ border: `1.5px solid ${C.white}` }} />
        <div className="absolute top-[18%] left-[42%] h-10 w-10 rotate-12 rounded-2xl opacity-15" style={{ border: `1.5px solid ${C.white}` }} />

        {/* Glass header panel */}
        <div className="absolute left-5 right-5" style={{ top: 18 }}>
          <div
            className="relative flex items-center gap-3 rounded-[18px] px-4 py-3"
            style={{
              background: 'rgba(255,255,255,0.09)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-md flex-shrink-0">
              <img
                src="/icpep_logo.jpg"
                alt="ICpEP"
                className="h-[34px] w-[34px] rounded-full object-cover"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-[11px] font-black tracking-[0.28em] text-white uppercase">
                ICpEP.SE
              </h2>
              <p className="text-[7.5px] font-semibold tracking-[0.32em] text-white/70 uppercase">
                Officer Identification
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Profile photo — bridges navy and white ── */}
      <div className="absolute z-10" style={{ left: '50%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <div
          className="flex items-center justify-center overflow-hidden border-[3px] shadow-[0_8px_28px_-6px_rgba(11,24,48,0.25)]"
          style={{
            width: 84,
            height: 84,
            borderRadius: 22,
            background: C.cardBg,
            borderColor: C.white,
            transform: 'rotate(45deg)',
          }}
        >
          <div style={{ transform: 'rotate(-45deg)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {profilePictureUrl ? (
              <img src={profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="text-2xl font-black" style={{ color: C.slate }}>{avatarInitial}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── White content area ── */}
      <div className="absolute inset-x-0" style={{ top: '44%', bottom: 0 }}>
        <div className="flex h-full flex-col px-6 pt-2">
          {/* Name + Position */}
          <div className="text-center mt-8">
            <div className="text-[8px] font-bold uppercase tracking-[0.3em]" style={{ color: C.accent }}>
              Officer
            </div>
            <h1 className="mt-1.5 text-[18px] font-black leading-tight" style={{ color: C.navy, wordBreak: 'break-word' }}>
              {fullName}
            </h1>
            <div className="mx-auto mt-2.5 h-px w-12 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)` }} />
            <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: C.royal }}>
              {position || '—'}
            </p>
          </div>

          {/* Info cards */}
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <div className="rounded-[14px] px-3.5 py-2.5" style={{ background: C.cardBg, border: `1px solid ${C.silver}` }}>
              <p className="text-[7px] font-bold uppercase tracking-[0.2em]" style={{ color: C.slate }}>A.Y.</p>
              <p className="mt-0.5 text-[11px] font-bold" style={{ color: C.navy }}>{yearText || '—'}</p>
            </div>
            <div className="rounded-[14px] px-3.5 py-2.5" style={{ background: C.cardBg, border: `1px solid ${C.silver}` }}>
              <p className="text-[7px] font-bold uppercase tracking-[0.2em]" style={{ color: C.slate }}>ID No.</p>
              <p className="mt-0.5 text-[10px] font-bold break-all" style={{ color: C.navy }}>{officerId || '—'}</p>
            </div>
          </div>

          {/* QR + Verification */}
          <div
            className="mt-3 flex items-center justify-between gap-3 rounded-[18px] px-4 py-3"
            style={{
              background: `linear-gradient(135deg, ${C.cardBg} 0%, white 100%)`,
              border: `1px solid ${C.silver}`,
            }}
          >
            <div className="min-w-0">
              <p className="text-[7px] font-bold uppercase tracking-[0.2em]" style={{ color: C.slate }}>Verification</p>
              <p className="mt-0.5 text-[9px] font-semibold" style={{ color: C.slate }}>
                Scan QR to confirm officer identity
              </p>
            </div>
            <div className="rounded-xl bg-white p-2 shadow-[0_4px_12px_-4px_rgba(11,24,48,0.12)] flex-shrink-0">
              <QRCodeSVG value={qrPayload} size={64} includeMargin={false} fgColor={C.navy} />
            </div>
          </div>

          {/* Footer */}
          <p className="mt-auto pb-4 text-center text-[7.5px] italic" style={{ color: '#94A3B8' }}>
            Official verification pass — valid for the current academic year
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Export Card (inline styles, no Tailwind) ──────────────────────────── */

function ExportCard({ qrPayload, fullName, position, yearText, officerId, profilePictureUrl, avatarInitial }) {
  return (
    <div
      style={{
        position: 'relative',
        width: CARD_W,
        height: CARD_H,
        borderRadius: 28,
        overflow: 'hidden',
        background: C.white,
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 24px 64px -12px rgba(11,24,48,0.45)',
      }}
    >
      {/* Navy diagonal block */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '44%' }}>
        <div
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyLight} 40%, ${C.royal} 100%)`,
            clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 ${Math.round(CARD_H * 0.44)}px)`,
          }}
        />
        <div
          style={{
            position: 'absolute', inset: 0,
            background: `linear-gradient(160deg, transparent 58%, ${C.accent}20 58%, ${C.accent}40 62%, transparent 62%)`,
            clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 ${Math.round(CARD_H * 0.44)}px)`,
          }}
        />
        <div
          style={{
            position: 'absolute', inset: 0, opacity: 0.04,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
            clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 ${Math.round(CARD_H * 0.44)}px)`,
          }}
        />
        <div style={{ position: 'absolute', top: -24, right: -24, width: 112, height: 112, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)', opacity: 0.2, clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 ${Math.round(CARD_H * 0.44)}px)` }} />
        <div style={{ position: 'absolute', bottom: '15%', left: -16, width: 64, height: 64, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.2)', opacity: 0.15 }} />
        <div style={{ position: 'absolute', top: '18%', left: '42%', width: 40, height: 40, transform: 'rotate(12deg)', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.2)', opacity: 0.15 }} />

        {/* Header panel */}
        <div style={{ position: 'absolute', left: 20, right: 20, top: 18 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            borderRadius: 18, padding: '12px 14px',
            background: 'rgba(255,255,255,0.09)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(4px)',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.12)', flexShrink: 0 }}>
              <img src="/icpep_logo.jpg" alt="ICpEP" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: '0.28em', textTransform: 'uppercase' }}>ICpEP.SE</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 7.5, fontWeight: 600, letterSpacing: '0.32em', textTransform: 'uppercase', marginTop: 2 }}>
                Officer Identification
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile photo — diamond rotated */}
      <div style={{ position: 'absolute', zIndex: 10, left: '50%', top: '36%', transform: 'translate(-50%, -50%)' }}>
        <div style={{
          width: 84, height: 84, borderRadius: 22,
          border: '3px solid #fff',
          background: C.cardBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
          transform: 'rotate(45deg)',
          boxShadow: '0 8px 28px -6px rgba(11,24,48,0.25)',
        }}>
          <div style={{ transform: 'rotate(-45deg)', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {profilePictureUrl
              ? <img src={profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 24, fontWeight: 900, color: C.slate }}>{avatarInitial}</span>
            }
          </div>
        </div>
      </div>

      {/* White content */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: '44%', bottom: 0, display: 'flex', flexDirection: 'column', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: C.accent }}>
            Officer
          </div>
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900, color: C.navy, lineHeight: 1.2, wordBreak: 'break-word' }}>
            {fullName}
          </div>
          <div style={{ margin: '10px auto 0', width: 48, height: 1, borderRadius: '50%', background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)` }} />
          <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.royal }}>
            {position || '—'}
          </div>
        </div>

        {/* Info cards */}
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div style={{ borderRadius: 14, padding: '8px 12px', background: C.cardBg, border: `1px solid ${C.silver}` }}>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.slate }}>A.Y.</div>
            <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: C.navy }}>{yearText || '—'}</div>
          </div>
          <div style={{ borderRadius: 14, padding: '8px 12px', background: C.cardBg, border: `1px solid ${C.silver}` }}>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.slate }}>ID No.</div>
            <div style={{ marginTop: 2, fontSize: 10, fontWeight: 700, color: C.navy, wordBreak: 'break-all' }}>{officerId || '—'}</div>
          </div>
        </div>

        {/* QR */}
        <div style={{
          marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          borderRadius: 18, padding: '10px 14px',
          background: `linear-gradient(135deg, ${C.cardBg} 0%, #fff 100%)`,
          border: `1px solid ${C.silver}`,
        }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: C.slate }}>Verification</div>
            <div style={{ marginTop: 2, fontSize: 9, fontWeight: 600, color: C.slate }}>
              Scan QR to confirm
            </div>
          </div>
          <div style={{ borderRadius: 12, background: '#fff', padding: 8, boxShadow: '0 4px 12px -4px rgba(11,24,48,0.12)' }}>
            <QRCodeSVG value={qrPayload} size={64} includeMargin={false} fgColor={C.navy} />
          </div>
        </div>

        <div style={{ marginTop: 'auto', paddingBottom: 14, textAlign: 'center', fontSize: 7.5, fontStyle: 'italic', color: '#94A3B8' }}>
          Official verification pass — valid for the current academic year
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ────────────────────────────────────────────────────── */

export default function OfficerIdCard({ profile, user }) {
  const exportRef = useRef(null)
  const [saving, setSaving] = useState(false)

  const fullName = useMemo(() => {
    return [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Authorized Officer'
  }, [profile])

  const yearText = useMemo(() => {
    const map = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' }
    const v = String(profile?.year_level ?? '')
    return map[v] || profile?.year_level || ''
  }, [profile?.year_level])

  const officerId = profile?.officer_id || ''

  const qrPayload = useMemo(() => {
    const uid = user?.id || profile?.id || ''
    const pos = profile?.position || '\u2014'
    const nameValue = fullName || 'Authorized Officer'
    const positionValue = pos || '\u2014'
    const idValue = officerId || ''
    return `name=${encodeURIComponent(nameValue)}|position=${encodeURIComponent(positionValue)}|id=${encodeURIComponent(idValue)}|uid=${uid}`
  }, [officerId, fullName, profile, user])

  const avatarInitial = String(profile?.first_name || '?').slice(0, 1).toUpperCase()

  const profilePictureUrl = profile?.profile_picture || null

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
      a.download = `ICpEP_Officer_Card_${officerId || 'officer'}.png`
      a.click()
    } catch (err) {
      console.error('Canvas processing error:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="w-full flex justify-center" style={{ maxWidth: CARD_W }}>
        <DisplayCard
          qrPayload={qrPayload}
          fullName={fullName}
          position={profile?.position || ''}
          yearText={yearText}
          officerId={officerId}
          profilePictureUrl={profilePictureUrl}
          avatarInitial={avatarInitial}
        />
      </div>

      {/* Hidden export block */}
      <div style={{ position: 'fixed', left: 9999, top: 0, opacity: 0, pointerEvents: 'none' }}>
        <div
          ref={exportRef}
          style={{
            width: CARD_W + 80,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 40,
            background: '#f1f5f9',
            borderRadius: 24,
          }}
        >
          <div style={{
            width: CARD_W,
            height: CARD_H,
            position: 'relative',
            borderRadius: 28,
            overflow: 'hidden',
            boxShadow: '0 0 0 1.5px #CBD5E1',
          }}>
            <ExportCard
              qrPayload={qrPayload}
              fullName={fullName}
              position={profile?.position || ''}
              yearText={yearText}
              officerId={officerId}
              profilePictureUrl={profilePictureUrl}
              avatarInitial={avatarInitial}
            />
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="mt-8 w-full max-w-xs space-y-3">
        <button
          type="button"
          onClick={saveAsPng}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold tracking-wide text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.99]"
        >
          {saving ? 'Processing Export...' : 'Download Officer ID (PNG)'}
        </button>
      </div>
    </div>
  )
}
