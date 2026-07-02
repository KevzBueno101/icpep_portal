import { useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'

const COLORS = {
  navyDark: '#03152B',
  navyLight: '#071F3D',
  white: '#FFFFFF',
}

const CARD_W = 300
const CARD_H = 470

/* ─── Display Card (Tailwind) ───────────────────────────────────────────── */

function DisplayCard({ qrPayload, fullName, position, yearText, officerId, profilePictureUrl, avatarInitial }) {
  return (
    <div
      className="relative w-full rounded-[28px] shadow-2xl overflow-hidden select-none"
      style={{ maxWidth: CARD_W, height: CARD_H, background: `linear-gradient(145deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)` }}
    >
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full border border-white/30" />
        <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full border border-white/20" />
      </div>

      <div className="relative h-full flex flex-col px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/95 shadow-md">
            <img
              src="/icpep_logo.jpg"
              alt="ICpEP Logo"
              className="h-9 w-9 rounded-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </div>
          <div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-white">
              ICpEP.SE
            </h2>
            <p className="text-[8px] uppercase tracking-[0.3em] text-sky-200/90">
              Officer ID Card
            </p>
          </div>
        </div>

        <div className="mt-4 flex-1 rounded-[24px] bg-white/95 p-4 shadow-[0_10px_30px_rgba(2,12,24,0.2)]">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm">
              {profilePictureUrl ? (
                <img src={profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-black text-slate-700">{avatarInitial}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-slate-500">
                Officer
              </p>
              <h1 className="text-[15px] font-black leading-tight text-slate-900 break-words">
                {fullName}
              </h1>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                Position
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-900">
                {position || '—'}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 px-3 py-2">
              <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                A.Y.
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-900">
                {yearText || '—'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                ID
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-slate-900 break-all">
                #{officerId || '—'}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-2 shadow-md">
              <QRCodeSVG value={qrPayload} size={72} includeMargin={false} fgColor={COLORS.navyDark} />
            </div>
          </div>
        </div>

        <p className="mt-3 text-center text-[8px] italic text-slate-300">
          Official verification pass for the academic year
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
        borderRadius: 24,
        overflow: 'hidden',
        background: `linear-gradient(145deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
        fontFamily: 'Arial, sans-serif',
        boxShadow: '0 18px 40px rgba(2, 12, 24, 0.2)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
        }}
      >
        <div style={{ position: 'absolute', top: -24, right: -24, width: 120, height: 120, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.3)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)' }} />
      </div>

      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.12)' }}>
            <img src="/icpep_logo.jpg" alt="ICpEP Logo" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ color: '#fff', fontSize: 11, fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase' }}>ICpEP.SE</div>
            <div style={{ color: '#CFFAFE', fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', marginTop: 2 }}>Officer ID Card</div>
          </div>
        </div>

        <div style={{ marginTop: 16, flex: 1, borderRadius: 20, background: 'rgba(255,255,255,0.95)', padding: 16, boxShadow: '0 10px 30px rgba(2,12,24,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', overflow: 'hidden', border: '1px solid #E2E8F0', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {profilePictureUrl
                ? <img src={profilePictureUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 20, fontWeight: 900, color: '#334155' }}>{avatarInitial}</span>
              }
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#64748B' }}>Officer</div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', lineHeight: 1.2, wordBreak: 'break-word' }}>{fullName}</div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ borderRadius: 12, background: '#F8FAFC', padding: '8px 10px' }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#64748B' }}>Position</div>
              <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{position || '—'}</div>
            </div>
            <div style={{ borderRadius: 12, background: '#F8FAFC', padding: '8px 10px' }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#64748B' }}>A.Y.</div>
              <div style={{ marginTop: 2, fontSize: 11, fontWeight: 700, color: '#0F172A' }}>{yearText || '—'}</div>
            </div>
          </div>

          <div style={{ marginTop: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#64748B' }}>ID</div>
              <div style={{ marginTop: 2, fontSize: 10, fontWeight: 700, color: '#0F172A', wordBreak: 'break-all' }}>#{officerId || '—'}</div>
            </div>
            <div style={{ borderRadius: 14, background: '#fff', padding: 8, boxShadow: '0 8px 20px rgba(15,23,42,0.08)' }}>
              <QRCodeSVG value={qrPayload} size={72} includeMargin={false} fgColor={COLORS.navyDark} />
            </div>
          </div>
        </div>

        <div style={{ marginTop: 10, textAlign: 'center', fontSize: 8, fontStyle: 'italic', color: '#CFFAFE' }}>
          Official verification pass for the academic year
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
