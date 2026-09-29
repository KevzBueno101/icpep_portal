import React, { useMemo, useRef, useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import QRCode from 'qrcode'
import html2canvas from 'html2canvas'

const C = {
  navy:       '#0B1830',
  navyLight:  '#132244',
  royal:      '#1C3B6B',
  accent:     '#2B7BE4',
  white:      '#FFFFFF',
  silver:     '#E2E8F0',
  slate:      '#475569',
  cardBg:     '#F8FAFC',
}

const CARD_W = 300
const CARD_H = 500
const QR_SIZE = 96

/* ─── Display Card ─────────────────────────────────────────────────────── */

const DisplayCard = ({ qrPayload, qrImageSrc, fullName, position, profilePictureUrl, avatarInitial }) => {
  return (
    <div
      className="relative overflow-hidden rounded-[28px] shadow-[0_24px_64px_-12px_rgba(11,24,48,0.45)] select-none"
      style={{ width: CARD_W, height: CARD_H, background: C.white, flexShrink: 0 }}
    >
      {/* ── Top navy block with diagonal cut ── */}
      <div className="absolute inset-x-0 top-0" style={{ height: '35%' }}>
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${C.navy} 0%, ${C.navyLight} 40%, ${C.royal} 100%)`,
          }}
        />
        {/* Diagonal accent stripe */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(160deg, transparent 58%, ${C.accent}20 58%, ${C.accent}40 62%, transparent 62%)`,
          }}
        />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
        {/* Decorative circles */}
        <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full opacity-20" style={{ border: `1.5px solid ${C.white}` }} />
        <div className="absolute bottom-[18%] -left-4 h-16 w-16 rounded-full opacity-15" style={{ border: `1.5px solid ${C.white}` }} />
        <div className="absolute top-[22%] left-[48%] h-10 w-10 rotate-12 rounded-2xl opacity-15" style={{ border: `1.5px solid ${C.white}` }} />

        {/* ── Header: centered logos + org text ── */}
        <div className="absolute inset-x-0" style={{ top: 16 }}>
          <div className="flex items-center justify-center gap-1 px-3">
            <img
              src="/icpep_logo.png"
              alt="ICpEP"
              className="h-12 w-12 flex-shrink-0 rounded-full object-cover bg-white shadow-md"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div className="min-w-0 text-center">
              <p className="text-[7.5px] font-bold leading-snug text-white/90">
                Institute of Computer Engineers of the Philippines - Student Edition
              </p>
              <p className="mt-1 text-[6.5px] font-semibold leading-snug text-blue-200/80">
                College of Engineering and Architecture
              </p>
              <p className="mt-0.5 text-[6px] font-bold leading-snug tracking-wider text-blue-300/70 uppercase">
                Catanduanes State University
              </p>
            </div>
            <img
              src="/cea-logo.png"
              alt="CEA"
              className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
        </div>
      </div>

      {/* ── Profile photo — circle ── */}
      <div className="absolute z-10" style={{ left: '50%', top: '35%', transform: 'translate(-50%, -50%)' }}>
        <div
          className="flex items-center justify-center overflow-hidden border-[3px] shadow-[0_8px_28px_-6px_rgba(11,24,48,0.25)]"
          style={{
            width: 88,
            height: 88,
            borderRadius: '50%',
            background: C.cardBg,
            borderColor: C.white,
          }}
        >
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-black" style={{ color: C.slate }}>{avatarInitial}</span>
          )}
        </div>
      </div>

      {/* ── White content area ── */}
      <div className="absolute inset-x-0" style={{ top: '35%', bottom: 0 }}>
        <div className="flex h-full flex-col px-6 pt-2">
          {/* Name + Position */}
          <div className="text-center mt-9">
            <div className="text-[8px] font-bold uppercase tracking-[0.3em]" style={{ color: C.accent }}>
              Officer
            </div>
            <h1 className="mt-1.5 text-[18px] font-black leading-tight" style={{ color: C.navy, wordBreak: 'break-word' }}>
              {fullName}
            </h1>
            <div className="mx-auto mt-2.5 h-px w-12 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${C.accent}, transparent)` }} />
            <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: C.royal }}>
              {position || '\u2014'}
            </p>
          </div>

          {/* QR + Verification */}
          <div
            className="mt-1.5 flex items-center justify-center gap-3 rounded-[18px] px-4 py-3"
            style={{
              background: `linear-gradient(135deg, ${C.cardBg} 0%, white 100%)`,
            }}
          >
            <div className="min-w-0">
              <p className="text-[7px] font-bold uppercase tracking-[0.2em]" style={{ color: C.slate }}>ICpEP.SE</p>
              <p className="mt-0.5 text-[9px] font-semibold" style={{ color: C.slate }}>
                Officer's ID Card
              </p>
            </div>
            <div className="flex-shrink-0">
              {qrImageSrc ? (
                <img src={qrImageSrc} alt="QR" width={QR_SIZE} height={QR_SIZE} />
              ) : (
                <QRCodeSVG value={qrPayload} size={QR_SIZE} includeMargin={false} fgColor={C.navy} />
              )}
            </div>
          </div>

          {/* Footer */}
          <p className="mt-auto pb-2.5 text-center text-[7.5px] italic" style={{ color: '#94A3B8' }}>
            Official verification pass — valid for the current academic year
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Component ────────────────────────────────────────────────────── */

export default function OfficerIdCard({ profile, user, profilePictureUrl: profilePictureUrlProp }) {
  const exportRef = useRef(null)
  const [saving, setSaving] = useState(false)
  const [qrImageSrc, setQrImageSrc] = useState('')

  const fullName = useMemo(() => {
    return [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—'
  }, [profile])

  const officerId = profile?.officer_id || ''

  const qrPayload = useMemo(() => {
    const uid = user?.id || profile?.id || ''
    const pos = profile?.position || '\u2014'
    const nameValue = fullName || '—'
    const positionValue = pos || '\u2014'
    const idValue = officerId || ''
    return `name=${encodeURIComponent(nameValue)}|position=${encodeURIComponent(positionValue)}|id=${encodeURIComponent(idValue)}|uid=${uid}`
  }, [officerId, fullName, profile, user])

  const avatarInitial = String(profile?.first_name || '?').slice(0, 1).toUpperCase()

  const profilePictureUrl = profilePictureUrlProp || profile?.profile_picture || null

  const cardWrapperRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = cardWrapperRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        setScale(Math.min(1, w / CARD_W))
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const waitForImages = (root) => {
    const images = root ? Array.from(root.querySelectorAll('img')) : []
    return Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete) return resolve()
            img.onload = resolve
            img.onerror = resolve
          })
      )
    )
  }

  const saveAsPng = async () => {
    try {
      setSaving(true)

      // html2canvas cannot rasterise the inline-SVG QR, so render the QR as a
      // crisp <img> in the hidden export clone. Use a high-res source so it
      // stays sharp at the 3x supersample scale.
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: QR_SIZE * 3,
        margin: 0,
        color: { dark: C.navy, light: '#ffffff' },
      })
      setQrImageSrc(qrDataUrl)

      // Give React a tick to swap the SVG for the <img> before exporting.
      await new Promise((resolve) => setTimeout(resolve, 50))
      await waitForImages(exportRef.current)

      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#E2E8F0',
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
      console.error('Canvas rendering error:', err)
      alert('Download failed: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center p-4">
      <div ref={cardWrapperRef} className="w-full flex justify-center overflow-hidden" style={{ height: CARD_H * scale }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center', flexShrink: 0 }}>
          <DisplayCard
            qrPayload={qrPayload}
            fullName={fullName}
            position={profile?.position || ''}
            profilePictureUrl={profilePictureUrl}
            avatarInitial={avatarInitial}
          />
        </div>
      </div>

      {/* Hidden export clone — same component, QR as <img>, off-screen so html2canvas can snapshot it */}
      <div
        style={{
          position: 'fixed',
          left: -9999,
          top: 0,
          opacity: 0,
          pointerEvents: 'none',
          padding: 28,
          background: '#E2E8F0',
        }}
      >
        <div ref={exportRef} style={{ width: CARD_W, height: CARD_H }}>
          <DisplayCard
            qrPayload={qrPayload}
            qrImageSrc={qrImageSrc || undefined}
            fullName={fullName}
            position={profile?.position || ''}
            profilePictureUrl={profilePictureUrl}
            avatarInitial={avatarInitial}
          />
        </div>
      </div>

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