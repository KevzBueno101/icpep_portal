import { useMemo, useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'

const C = {
  navyDark: '#03152B',
  navyLight: '#071F3D',
  accentBlue: '#0C2D54',
  white: '#FFFFFF',
  textGray: '#7E91A6',
}

/* ─── Card Front (Photo + Member Info + QR) ──────────── */

function CardFront({
  qrPayload,
  fullName,
  yearText,
  profile,
  avatarInitial,
  onFlip,
}) {
  const yearLabel = yearText
  const course = profile?.course || 'BSCPE'
  const section = profile?.section || '—'
  const studentNo = profile?.student_number || '—'

  return (
    <div className="relative w-full h-full rounded-xl shadow-xl overflow-hidden select-none bg-white">
      {/* ── Geometric background overlay ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 384 224" preserveAspectRatio="none">
        {/* Dark navy polygon left half */}
        <polygon points="0,0 240,0 210,224 0,224" fill={C.navyDark} />
        <polygon points="240,0 250,0 220,224 210,224" fill={C.navyLight} />
        <polygon points="250,0 270,0 240,224 220,224" fill={C.accentBlue} />
      </svg>

      {/* ── Header bar ── */}
      <div className="absolute top-0 left-0 right-0 h-[58px] z-10 flex items-center px-4 gap-3">
        <div className="h-[34px] w-[34px] rounded-full overflow-hidden bg-white/10 ring-2 ring-white/20 flex items-center justify-center flex-shrink-0">
          <img src="/icpep_logo.jpg" alt="ICpEP" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] font-black tracking-[0.15em] text-white leading-tight uppercase">ICpEP.SE</span>
          <span className="text-[5.5px] font-semibold text-blue-300 tracking-wide leading-tight">Catanduanes State University</span>
        </div>

        {onFlip && (
          <button
            type="button"
            onClick={onFlip}
            className="ml-auto rounded-lg bg-white/10 px-2 py-0.5 text-[7px] font-bold text-white/80 border border-white/15 hover:bg-white/20 active:scale-95 transition-all"
          >
            Flip
          </button>
        )}
      </div>

      {/* ── White content area ── */}
      <div className="absolute left-0 right-0 z-10" style={{ top: '58px', bottom: '56px' }}>
        <div className="flex h-full px-4 py-2.5 gap-3">
          {/* Photo */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="h-[68px] w-[54px] rounded-lg overflow-hidden border-2 border-white shadow-md bg-white flex items-center justify-center">
                {profile?.profile_picture ? (
                  <img src={profile.profile_picture} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-black text-blue-900/30">{avatarInitial}</span>
                )}
              </div>
              {profile?.membership_status === 'APPROVED' && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-0.5 rounded-full bg-emerald-50 border border-emerald-200 px-1.5 py-[1px] shadow-sm whitespace-nowrap">
                  <span className="h-1 w-1 rounded-full bg-emerald-500" />
                  <span className="text-[4.5px] font-bold text-emerald-700 uppercase tracking-wider">Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Member details */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            <h1 className="text-[11px] font-black text-slate-900 leading-tight truncate">
              {fullName}
            </h1>
            <p className="text-[7.5px] font-semibold text-blue-800 uppercase tracking-wide mt-0.5">
              {course}
              <span className="text-slate-400 font-normal lowercase"> • </span>
              <span className="text-slate-600 font-medium normal-case">{yearLabel}</span>
            </p>

            <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5">
              <div>
                <span className="text-[5px] font-bold uppercase tracking-widest text-slate-400">ID No.</span>
                <p className="text-[8px] font-bold text-slate-800 leading-tight">{studentNo}</p>
              </div>
              <div>
                <span className="text-[5px] font-bold uppercase tracking-widest text-slate-400">Block</span>
                <p className="text-[8px] font-bold text-slate-800 leading-tight">{section}</p>
              </div>
              <div>
                <span className="text-[5px] font-bold uppercase tracking-widest text-slate-400">A.Y.</span>
                <p className="text-[8px] font-bold text-slate-800 leading-tight">2025–2026</p>
              </div>
              <div>
                <span className="text-[5px] font-bold uppercase tracking-widest text-slate-400">Contact</span>
                <p className="text-[8px] font-bold text-slate-800 leading-tight truncate">{profile?.contact_number || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[56px] z-10 flex items-center px-3 gap-2.5" style={{ background: `linear-gradient(135deg, ${C.navyDark} 0%, ${C.accentBlue} 100%)` }}>
        {/* Diagonal accent */}
        <svg className="absolute right-0 top-0 h-full pointer-events-none" style={{ width: '44px' }} viewBox="0 0 44 56" preserveAspectRatio="none">
          <polygon points="44,0 6,0 24,56 44,56" fill={C.white} opacity="0.06" />
        </svg>

        {/* QR */}
        <div className="h-[42px] w-[42px] rounded-lg bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-md relative z-10">
          <QRCodeSVG value={qrPayload} size={34} includeMargin={false} fgColor={C.navyDark} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 relative z-10">
          <p className="text-[6px] font-bold text-blue-300 uppercase tracking-wider truncate">{fullName}</p>
          <p className="text-[5px] text-white/60 font-medium truncate">ID: {studentNo} &middot; {course} &middot; Block {section}</p>
          <p className="text-[4.5px] text-white/40 font-medium">ICpEP.SE — Catanduanes State University</p>
        </div>

        {/* Seal badge */}
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0 bg-white/10 rounded-lg px-2 py-1 border border-white/10 relative z-10">
          <div className="h-4 w-4 rounded-full bg-white/10 flex items-center justify-center">
            <img src="/icpep_logo.jpg" alt="" className="w-3 h-3 object-contain opacity-60" />
          </div>
          <span className="text-[4px] font-bold text-white/50 uppercase tracking-wider">Member</span>
        </div>
      </div>
    </div>
  )
}

/* ─── Card Back (Terms & Conditions + Contact) ──────── */

function CardBack({
  qrPayload,
  profile,
  userEmail,
  onFlip,
}) {
  const terms = [
    'This ID is non-transferable and must be carried at all times during official ICpEP.SE activities and events.',
    'Loss or damage of this ID must be reported immediately to the organization administration.',
    'Unauthorized use, duplication, or alteration of this ID is strictly prohibited.',
    'This ID remains the property of ICpEP.SE — Catanduanes State University Chapter and must be surrendered upon request.',
    'Use of this ID implies full acceptance of the organization’s constitution, bylaws, and code of conduct.',
    'Members are required to present this ID upon request during official events, examinations, and transactions.',
  ]

  return (
    <div className="relative w-full h-full rounded-xl shadow-xl overflow-hidden select-none">
      {/* ── Solid navy background ── */}
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${C.navyDark} 0%, ${C.accentBlue} 100%)` }} />

      {/* ── Geometric overlay ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.07]" viewBox="0 0 384 224" preserveAspectRatio="none">
        <polygon points="160,0 384,0 384,224 200,224" fill={C.white} />
        <polygon points="180,0 384,0 384,224 220,224" fill={C.navyLight} />
      </svg>

      {/* Subtle tech lines */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
        <div className="absolute w-full h-[200%] top-[-50%] left-[10%] rotate-[32deg]" style={{ backgroundImage: `linear-gradient(90deg, transparent 0%, ${C.white} 1px, transparent 1px)`, backgroundSize: '36px 100%' }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col h-full px-4 py-3">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <div className="h-[22px] w-[22px] rounded-full overflow-hidden bg-white/10 ring-1 ring-white/20 flex items-center justify-center flex-shrink-0">
            <img src="/icpep_logo.jpg" alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
          </div>
          <div className="flex-1">
            <h3 className="text-[7px] font-black tracking-[0.2em] text-white uppercase leading-tight">Terms &amp; Conditions</h3>
            <p className="text-[4.5px] text-blue-300 font-medium">ICpEP.SE Membership ID Card</p>
          </div>
          {onFlip && (
            <button
              type="button"
              onClick={onFlip}
              className="rounded-lg bg-white/10 px-2 py-0.5 text-[7px] font-bold text-white/80 border border-white/15 hover:bg-white/20 active:scale-95 transition-all"
            >
              Flip
            </button>
          )}
        </div>

        {/* Terms list */}
        <div className="flex-1 space-y-1">
          {terms.map((term, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-[4.5px] font-black text-blue-400 leading-tight mt-[2px] flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
              <p className="text-[5px] text-white/75 leading-snug">{term}</p>
            </div>
          ))}
        </div>

        {/* Footer: Contact + QR */}
        <div className="flex items-end gap-2 pt-1.5 border-t border-white/10">
          {/* Contact */}
          <div className="flex-1 min-w-0">
            <p className="text-[4.5px] font-bold text-blue-300 uppercase tracking-wider">Contact</p>
            <p className="text-[5px] text-white/60 leading-snug">
              Email: {userEmail || 'icpep.catsu@email.com'}
            </p>
            <p className="text-[5px] text-white/60 leading-snug">
              Phone: {profile?.contact_number || '—'}
            </p>
            <p className="text-[5px] text-white/60 leading-snug">
              Web: icpep-catsu.org
            </p>
          </div>

          {/* QR mini */}
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
            <div className="h-[34px] w-[34px] rounded-md bg-white p-0.5 flex items-center justify-center shadow-md">
              <QRCodeSVG value={qrPayload} size={28} includeMargin={false} fgColor={C.navyDark} />
            </div>
            <span className="text-[3.5px] font-bold text-white/40 uppercase tracking-widest">Verify</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Main Wrapper ──────────────────────────────────── */

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

  const userEmail = profile?.user_email || ''

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
      <div className="relative w-full max-w-[384px]" style={{ perspective: '2000px' }}>
        <div className="relative w-full transition-transform duration-700" style={{ height: 224, transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
            <CardFront
              qrPayload={qrPayload}
              fullName={fullName}
              yearText={yearText}
              profile={profile}
              avatarInitial={avatarInitial}
              onFlip={() => setFlipped(true)}
            />
          </div>
          <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
            <CardBack
              qrPayload={qrPayload}
              profile={profile}
              userEmail={userEmail}
              onFlip={() => setFlipped(false)}
            />
          </div>
        </div>
      </div>

      {/* Hidden high-res export */}
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
            <CardFront
              qrPayload={qrPayload}
              fullName={fullName}
              yearText={yearText}
              profile={profile}
              avatarInitial={avatarInitial}
            />
          </div>
          <div style={{ width: '384px', height: '224px', position: 'relative' }}>
            <CardBack
              qrPayload={qrPayload}
              profile={profile}
              userEmail={userEmail}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 w-full max-w-[384px] space-y-3">
        <button
          type="button"
          onClick={saveAsPng}
          disabled={saving}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-bold tracking-wide text-white shadow-md hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-[0.99]"
        >
          {saving ? 'Processing...' : 'Download ID Card (PNG)'}
        </button>
      </div>
    </div>
  )
}
