import { useMemo, useRef, useState, forwardRef, useImperativeHandle, useContext, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'
import { OfficersContext } from '../../context/OfficersContext'

const C = {
  bg0: '#07112E',
  bg1: '#102D70',
  royal: '#102D70',
  electric: '#176BFF',
  violet: '#713CFF',
  cyan: '#00D5FF',
  silver: '#F1F5FF',
  muted: 'rgba(241,245,255,0.55)',
  faint: 'rgba(241,245,255,0.32)',
}

const FONT_DISPLAY = "'Orbitron','Rajdhani',ui-sans-serif,system-ui,sans-serif"
const FONT_TECH = "'Rajdhani','Inter',ui-sans-serif,system-ui,sans-serif"
const FONT_BODY = "'Inter','Poppins',ui-sans-serif,system-ui,sans-serif"

const ACADEMIC_YEAR = '2025–2026'
const EMPTY_OFFICERS = []

const officerName = (o) =>
  o?.fullName || [o?.first_name, o?.last_name].filter(Boolean).join(' ') || null

/* ─── Shared backdrop: navy gradient, restrained diagonal accents ─────────── */

function CardBackdrop() {
  return (
    <>
      <div
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(120deg, ${C.bg0} 0%, ${C.bg1} 52%, ${C.bg0} 100%)`,
        }}
      />
      {/* Sharp diagonal gradient bands — smooth, no hard shapes */}
      <div
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(115deg, transparent 52%, rgba(23,107,255,0.20) 54%, rgba(113,60,255,0.16) 56%, rgba(0,213,255,0.10) 58%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(115deg, transparent 78%, rgba(113,60,255,0.14) 80%, rgba(23,107,255,0.10) 82%, transparent 84%)`,
        }}
      />
      {/* Metallic top highlight */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, rgba(241,245,255,0.35) 0%, rgba(241,245,255,0.08) 40%, transparent 75%)',
        }}
      />
      {/* Soft depth glows */}
      <div
        style={{
          position: 'absolute', top: -70, right: -50, width: 220, height: 220,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.electric}26, transparent 68%)`,
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: -80, left: -40, width: 200, height: 200,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${C.violet}26, transparent 68%)`,
        }}
      />
    </>
  )
}

/* ─── QR: SVG on screen, PNG <img> inside the html2canvas export clone ────── */

function CardQR({ value, size, fgColor = C.bg0, imgSrc }) {
  if (imgSrc) {
    return <img src={imgSrc} alt="QR" width={size} height={size} style={{ display: 'block' }} />
  }
  return <QRCodeSVG value={value} size={size} includeMargin={false} fgColor={fgColor} />
}

/* ─── Front face: member identity | official seal ─────────────────────────── */

function FrontFace({ profile, fullName, yearText, avatarInitial, cacheKey, membershipFee, president, adviser, onFlip }) {
  const isPlus = membershipFee === 'PLUS'
  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%',
        borderRadius: 16, overflow: 'hidden',
        background: C.bg0,
        boxShadow: '0 18px 40px -12px rgba(2,6,23,0.8)',
        fontFamily: FONT_BODY,
      }}
    >
      <CardBackdrop />

      <div style={{ position: 'relative', height: '100%', display: 'flex', padding: '13px 15px', boxSizing: 'border-box' }}>
        {/* ── LEFT: identity ── */}
        <div style={{ width: '63%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FONT_TECH, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.1em', color: C.silver, lineHeight: 1.15 }}>
                ICpEP.SE - Catanduanes State University Chapter
              </div>
              <div style={{ fontSize: 5.5, fontWeight: 600, letterSpacing: '0.16em', color: C.muted, textTransform: 'uppercase', marginTop: 1.5 }}>
                Membership ID Card
              </div>
            </div>
          </div>

          {/* Member profile — vertically centered in remaining space */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 54, height: 54, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                border: `2px solid ${C.electric}`,
                boxShadow: '0 0 12px rgba(23,107,255,0.4)',
                background: C.royal,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {profile?.profile_picture ? (
                <img
                  src={`${profile.profile_picture}${profile.profile_picture.includes('?') ? '&' : '?'}_=${cacheKey}`}
                  alt="Member"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: 700, color: C.silver }}>
                  {avatarInitial}
                </span>
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: FONT_TECH, fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.03em', color: C.silver, textTransform: 'uppercase',
                  lineHeight: 1.12, wordBreak: 'break-word',
                }}
              >
                {fullName}
              </div>
              <div style={{ fontSize: 7, fontWeight: 500, letterSpacing: '0.08em', color: C.muted, textTransform: 'uppercase', marginTop: 2 }}>
                {profile?.course || 'BSCpE'}{yearText ? `  •  ${yearText}` : ''}
              </div>
              <div
                style={{
                  display: 'inline-block', marginTop: 4,
                  fontSize: 6, fontWeight: 700, letterSpacing: '0.18em',
                  color: isPlus ? C.cyan : C.muted, textTransform: 'uppercase',
                  fontFamily: FONT_TECH,
                  borderTop: `1px solid ${isPlus ? C.cyan : C.electric}`,
                  paddingTop: 2,
                }}
              >
                {isPlus ? 'Membership Plus' : 'Student Member'}
              </div>
            </div>
            </div>

          {/* Member identification */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px', marginTop: 5 }}>
            {[
              ['ID No.', profile?.student_number || '—'],
              ['Block', profile?.section || '—'],
              ['A.Y.', ACADEMIC_YEAR],
            ].map(([label, value]) => (
              <span key={label} style={{ fontSize: 6, fontWeight: 600, letterSpacing: '0.08em', color: C.muted, textTransform: 'uppercase', fontFamily: FONT_TECH }}>
                {label} <span style={{ color: C.silver }}>{value}</span>
              </span>
            ))}
          </div>
          </div>

          {/* Signatories — dynamic, blank until officers are assigned */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <div style={{ minWidth: 0, flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: FONT_BODY, fontSize: 7.5,
                  color: C.silver, lineHeight: 1.15, wordBreak: 'break-word',
                }}
              >
                {president || ' '}
              </div>
              <div
                style={{
                  fontSize: 4.5, fontWeight: 700, letterSpacing: '0.1em',
                  color: C.faint, textTransform: 'uppercase', marginTop: 1,
                  fontFamily: FONT_TECH,
                }}
              >
                President, ICpEP.SE CatSU
              </div>
            </div>
            <div style={{ minWidth: 0, flex: 1, textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: FONT_BODY, fontSize: 7.5,
                  color: C.silver, lineHeight: 1.15, wordBreak: 'break-word',
                }}
              >
                {adviser || ' '}
              </div>
              <div
                style={{
                  fontSize: 4.5, fontWeight: 700, letterSpacing: '0.1em',
                  color: C.faint, textTransform: 'uppercase', marginTop: 1,
                  fontFamily: FONT_TECH,
                }}
              >
                Adviser, ICpEP.SE CatSU
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: official seal ── */}
        <div style={{ width: '37%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                width: 118, height: 118, borderRadius: '50%',
                background: `radial-gradient(circle at 35% 30%, ${C.bg1} 0%, ${C.bg0} 78%)`,
                boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <img
                src="/icpep_logo.png"
                alt="ICpEP Official Seal"
                style={{ width: '94%', height: '94%', objectFit: 'contain' }}
              />
            </div>
            <div
              style={{
                fontSize: 5.5, fontWeight: 700, letterSpacing: '0.22em',
                color: C.muted, textTransform: 'uppercase', marginTop: 7,
                fontFamily: FONT_TECH,
              }}
            >
              Official Seal
            </div>
          </div>
        </div>
      </div>

      {onFlip && (
        <button
          type="button"
          onClick={onFlip}
          style={{
            position: 'absolute', right: 8, top: 8, zIndex: 10,
            borderRadius: 6, padding: '2px 8px',
            background: 'rgba(7,17,46,0.6)', border: '1px solid rgba(241,245,255,0.22)',
            color: 'rgba(241,245,255,0.85)', fontSize: 8, fontWeight: 700,
            fontFamily: FONT_TECH, letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Flip
        </button>
      )}
    </div>
  )
}

/* ─── Back face: QR verification ──────────────────────────────────────────── */

function BackFace({ qrPayload, qrImageSrc, onFlip }) {
  return (
    <div
      style={{
        position: 'relative', width: '100%', height: '100%',
        borderRadius: 16, overflow: 'hidden',
        background: C.bg0,
        boxShadow: '0 18px 40px -12px rgba(2,6,23,0.8)',
        fontFamily: FONT_BODY,
      }}
    >
      <CardBackdrop />

      <div
        style={{
          position: 'relative', height: '100%',
          display: 'flex', flexDirection: 'column',
          padding: '16px 18px', boxSizing: 'border-box',
        }}
      >
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* QR — primary focal point */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
            <div
              style={{
                background: '#fff', padding: 8, borderRadius: 10,
                boxShadow: '0 0 0 1px rgba(255,255,255,0.22), 0 8px 22px rgba(0,0,0,0.5), 0 0 26px rgba(23,107,255,0.28)',
              }}
            >
              <CardQR value={qrPayload} size={92} imgSrc={qrImageSrc} />
            </div>
            <div
              style={{
                fontSize: 6, fontWeight: 700, letterSpacing: '0.22em',
                color: C.muted, textTransform: 'uppercase', marginTop: 6,
                fontFamily: FONT_TECH, textAlign: 'center',
              }}
            >
              Scan to Verify
            </div>
          </div>

          {/* Certification statement */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: 7.5, fontWeight: 500, letterSpacing: '0.02em', color: C.muted, lineHeight: 1.5 }}>
              This is to certify that the person whose name and photograph appear herein is a duly registered member of{' '}
              <span style={{ fontFamily: FONT_TECH, fontWeight: 700, letterSpacing: '0.05em', color: C.cyan }}>
                ICpEP.SE CatSU Chapter
              </span>{' '}
              and shall enjoy the benefits of members as defined in the Article III of the ICPEP.SE Constitution and By-Laws
            </div>
          </div>
        </div>

        {/* Organizational identification */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 6, fontWeight: 600, letterSpacing: '0.18em', color: C.faint, textTransform: 'uppercase', fontFamily: FONT_TECH }}>
            Institute of Computer Engineers of the Philippines – Student Edition
          </div>
          <div style={{ fontSize: 6, fontWeight: 700, letterSpacing: '0.22em', color: C.muted, textTransform: 'uppercase', marginTop: 2, fontFamily: FONT_TECH }}>
            CatSU Chapter
          </div>
        </div>
      </div>

      {onFlip && (
        <button
          type="button"
          onClick={onFlip}
          style={{
            position: 'absolute', right: 8, top: 8, zIndex: 10,
            borderRadius: 6, padding: '2px 8px',
            background: 'rgba(7,17,46,0.6)', border: '1px solid rgba(241,245,255,0.22)',
            color: 'rgba(241,245,255,0.85)', fontSize: 8, fontWeight: 700,
            fontFamily: FONT_TECH, letterSpacing: '0.08em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Flip
        </button>
      )}
    </div>
  )
}

/* ─── Main component ──────────────────────────────────────────────────────── */

const MembershipCard = forwardRef(function MembershipCard({ profile, userId, cacheKey = 0, membershipFee }, ref) {
  const exportRef = useRef(null)
  const [flipped, setFlipped] = useState(false)
  const [saving, setSaving] = useState(false)
  const [qrImageSrc, setQrImageSrc] = useState('')

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

  // OfficersProvider is not mounted on every page that renders this card
  // (e.g. /admin/membership), so read the context directly — it is null there.
  const officersCtx = useContext(OfficersContext)
  const officers = officersCtx?.officers || EMPTY_OFFICERS

  const president = useMemo(
    () => officerName(officers.find((o) => /president/i.test(o?.position || ''))),
    [officers]
  )
  const adviser = useMemo(
    () => officerName(officers.find((o) => /adviser/i.test(o?.position || ''))),
    [officers]
  )

  const qrPayload = useMemo(() => {
    const sn = profile?.student_number || ''
    const uid = userId || profile?.user || ''
    const section = profile?.section || '—'
    return `ICPEP|${sn}|${fullName}|${section}|${uid}`
  }, [profile, userId, fullName])

  const avatarInitial = String(profile?.first_name || '?').slice(0, 1).toUpperCase()

  // Scale the fixed 384×224 card down on narrow/mobile screens so the whole
  // design stays proportional instead of overflowing or distorting.
  const cardWrapRef = useRef(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = cardWrapRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setScale(Math.min(1, entry.contentRect.width / 384))
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const faceProps = {
    profile,
    fullName,
    yearText,
    avatarInitial,
    cacheKey,
    membershipFee,
    qrPayload,
    president,
    adviser,
  }

  const saveAsPng = async () => {
    if (!exportRef.current) return
    const htmlEl = document.documentElement
    const wasDark = htmlEl.classList.contains('dark')
    try {
      setSaving(true)

      // html2canvas cannot rasterise the inline-SVG QR reliably, so render the
      // QR as a crisp PNG <img> inside the hidden export clone.
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 240,
        margin: 1,
        color: { dark: C.bg0, light: '#ffffff' },
      })
      setQrImageSrc(qrDataUrl)
      await new Promise((resolve) => setTimeout(resolve, 60))

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

      // Export against a light page palette so the PNG is consistent
      // regardless of the current dark-mode setting.
      if (wasDark) htmlEl.classList.remove('dark')

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
      if (wasDark) htmlEl.classList.add('dark')
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({
    download: saveAsPng,
  }))

  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      {/* Interactive flip card display — scaled to fit small screens */}
      <div ref={cardWrapRef} className="w-full flex justify-center overflow-hidden" style={{ height: 224 * scale }}>
        <div style={{ width: 384, height: 224, flexShrink: 0, transform: `scale(${scale})`, transformOrigin: 'top center' }}>
          <div className="relative w-full h-full" style={{ perspective: '2000px' }}>
            <div
              className="relative w-full h-full transition-transform duration-700"
              style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
            >
              <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
                <FrontFace {...faceProps} onFlip={() => setFlipped(true)} />
              </div>
              <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <BackFace {...faceProps} onFlip={() => setFlipped(false)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden export block — same faces, QR as <img>, off-screen for html2canvas */}
      <div style={{ position: 'fixed', left: -9999, top: 0, opacity: 0, pointerEvents: 'none' }}>
        <div
          ref={exportRef}
          style={{
            width: 868,
            display: 'flex',
            flexDirection: 'row',
            gap: 48,
            padding: 40,
            background: '#ffffff',
            borderRadius: 24,
          }}
        >
          <div style={{ width: 384, height: 224, position: 'relative', flexShrink: 0 }}>
            <FrontFace {...faceProps} qrImageSrc={qrImageSrc} />
          </div>
          <div style={{ width: 384, height: 224, position: 'relative', flexShrink: 0 }}>
            <BackFace {...faceProps} qrImageSrc={qrImageSrc} />
          </div>
        </div>
      </div>

      {/* Download button */}
      <div className="mt-8 w-full max-w-[384px] space-y-3">
        <button
          type="button"
          onClick={saveAsPng}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold tracking-wide shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
          style={{
            background: 'linear-gradient(135deg, #F8FAFF 0%, #C7D2E8 45%, #8FA3C4 100%)',
            color: '#0A1740',
            border: '1px solid rgba(255,255,255,0.5)',
            boxShadow: '0 6px 18px rgba(2,6,23,0.45), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {saving ? 'Processing Export...' : 'Download ID Card (PNG)'}
        </button>
      </div>
    </div>
  )
})

export default MembershipCard
