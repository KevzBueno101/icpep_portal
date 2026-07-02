import { useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'

const COLORS = {
  navyDark: '#03152B',
  navyLight: '#071F3D',
  white: '#FFFFFF',
}

const CARD_W = 280
const CARD_H = 430

/* ─── Display Card (Tailwind) ───────────────────────────────────────────── */

function DisplayCard({ qrPayload, fullName, position, yearText, officerId, profilePictureUrl, avatarInitial }) {
  return (
    <div
      className="relative w-full rounded-2xl shadow-xl overflow-hidden select-none"
      style={{ maxWidth: CARD_W, height: CARD_H, backgroundColor: COLORS.navyDark }}
    >
      {/* Gradient background */}
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `linear-gradient(180deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)` }}
      />

      {/* Decorative geometric lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        <div
          className="absolute w-[200%] h-full top-0 left-[-50%]"
          style={{
            transform: 'rotate(-20deg)',
            backgroundImage: `linear-gradient(90deg, transparent 0%, ${COLORS.white} 1.5px, transparent 1.5px)`,
            backgroundSize: '30px 100%',
          }}
        />
      </div>

      <div className="relative h-full flex flex-col items-center px-5 py-6">
        {/* Logo + Org Name */}
        <div className="flex flex-col items-center mb-3">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20 bg-white flex items-center justify-center shadow-md mb-1.5">
            <img
              src="/icpep_logo.jpg"
              alt="ICpEP Logo"
              className="w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <h2 className="text-sm font-bold tracking-[0.15em] text-white leading-tight">
            ICpEP.SE
          </h2>
          <p className="text-[9px] font-medium tracking-[0.1em] text-gray-400 uppercase mt-0.5">
            Officer ID Card
          </p>
        </div>

        {/* Profile Picture */}
        <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-white/20 bg-white/5 flex items-center justify-center mb-3 flex-shrink-0">
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl font-black text-white">{avatarInitial}</span>
          )}
        </div>

        {/* Name */}
        <h1 className="text-base font-black tracking-normal text-white text-center leading-tight mb-1 px-2 break-words">
          {fullName}
        </h1>

        {/* Position */}
        <p className="text-[11px] font-bold text-sky-300 uppercase tracking-wider text-center mb-1">
          {position || '—'}
        </p>

        {/* Year Level */}
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider text-center mb-4">
          {yearText || '—'}
        </p>

        {/* Separator */}
        <div className="w-3/4 h-px bg-white/10 mb-4" />

        {/* QR Code + ID Info */}
        <div className="flex items-center gap-3">
          <div className="bg-white p-1.5 rounded-lg shadow-lg flex-shrink-0">
            <QRCodeSVG value={qrPayload} size={64} includeMargin={false} fgColor={COLORS.navyDark} />
          </div>
          <div className="text-white/90">
            <p className="text-[7px] font-mono font-bold tracking-wide">
              ID# {officerId || '—'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-[7px] font-medium text-gray-500 italic mt-auto">
          Valid for 1 Academic Year
        </p>
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
        borderRadius: 16,
        overflow: 'hidden',
        background: `linear-gradient(180deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {/* Decorative lines */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          opacity: 0.1,
          backgroundImage: `linear-gradient(90deg, transparent 0%, #fff 1.5px, transparent 1.5px)`,
          backgroundSize: '30px 100%',
          transform: 'rotate(-20deg) scaleX(2)',
          transformOrigin: 'center',
        }}
      />

      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '24px 20px',
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.2)',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 6,
          }}
        >
          <img src="/icpep_logo.jpg" alt="ICpEP Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: '0.15em' }}>
          ICpEP.SE
        </div>
        <div style={{ color: '#9CA3AF', fontSize: 9, fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
          Officer ID Card
        </div>

        {/* Profile Picture */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 12,
            marginBottom: 12,
            flexShrink: 0,
          }}
        >
          {profilePictureUrl
            ? <img src={profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{avatarInitial}</span>
          }
        </div>

        {/* Name */}
        <div style={{ fontSize: 15, fontWeight: 900, color: '#fff', textTransform: 'uppercase', textAlign: 'center', lineHeight: 1.2, wordBreak: 'break-word', padding: '0 8px', marginBottom: 4 }}>
          {fullName}
        </div>

        {/* Position */}
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7DD3FC', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: 4 }}>
          {position || '—'}
        </div>

        {/* Year Level */}
        <div style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', marginBottom: 16 }}>
          {yearText || '—'}
        </div>

        {/* Separator */}
        <div style={{ width: '75%', height: 1, background: 'rgba(255,255,255,0.1)', marginBottom: 16 }} />

        {/* QR + ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#fff', padding: 6, borderRadius: 8, flexShrink: 0 }}>
            <QRCodeSVG value={qrPayload} size={64} includeMargin={false} fgColor={COLORS.navyDark} />
          </div>
          <div style={{ color: 'rgba(255,255,255,0.9)' }}>
            <div style={{ fontSize: 8, fontWeight: 700, fontFamily: 'monospace' }}>
              ID# {officerId || '—'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 7, fontWeight: 500, color: '#6B7280', fontStyle: 'italic', marginTop: 'auto' }}>
          Valid for 1 Academic Year
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
      {/* Display card */}
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
            borderRadius: 16,
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
