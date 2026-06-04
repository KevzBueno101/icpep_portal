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
    }
  }
  return {
    stripe: 'bg-rose-500',
    ring: 'ring-rose-400/30',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    badgeText: 'text-rose-800',
    dot: 'bg-rose-500',
  }
}

// Reusable Front Side Component
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
      {/* background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070E1B] to-[#061226]" />
      {/* subtle hex/grid */}
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.22) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          mixBlendMode: 'screen',
        }}
      />
      {/* cyan glow lines */}
      <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl" />
      <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-cyan-500/15 blur-2xl" />

      {/* Top stripe */}
      <div className={`h-2 w-full ${colors.stripe}`} />

      <div className="relative h-full px-4 py-4 flex flex-col justify-between">
        {/* header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/icpep_logo.png"
              alt="ICPEP.SE | CatSU Chapter"
              className="h-11 w-11 rounded-xl ring-1 ring-white/20 bg-white/5"
            />
            <div>
              <div className="text-[10px] font-semibold tracking-wide text-white/70">ICPEP.SE</div>
              <div className="text-xs font-bold text-white">Membership ID</div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${colors.badgeBg
                }  ${colors.badgeBorder} ${colors.badgeText} bg-opacity-90`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
              {String(profile?.membership_status || 'PENDING').toUpperCase() === 'APPROVED' ? 'VERIFIED' : String(profile?.membership_status || 'PENDING').toUpperCase()}
            </div>
          </div>
        </div>

        {/* profile row */}
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
                  <span className="text-sm font-extrabold text-white">
                    {avatarInitial}
                  </span>
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
              <span className="ml-1.5 font-mono tracking-wide text-white">{profile?.student_number || '—'}</span>
            </div>
          </div>
        </div>

        {/* details */}
        <div className="mt-2">
          <div className="text-xs font-semibold text-white/90">
            {profile?.course || '—'} • {yearText || '—'} • {profile?.section || '—'}
          </div>
          <div className="mt-0.5 text-[10px] text-white/60">
            {memberSinceText} • {chapterName}
          </div>
        </div>
      </div>

      {/* flip hint */}
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

// Reusable Back Side Component
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#070E1B] to-[#061226]" />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.22) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          mixBlendMode: 'screen',
        }}
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
              <div className="text-[9px] text-white/70">
                GCash proof required for renewal.
              </div>
            ) : (
              <div className="text-[9px] text-white/70">On-hand payment recorded.</div>
            )}

            <div className="text-[9px] text-white/50">
              Student No: <span className="font-mono text-white/70">{profile?.student_number || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MembershipCard({ profile, userId, paymentMethod }) {
  const exportRef = useRef(null)
  const [flipped, setFlipped] = useState(false)
  const [saving, setSaving] = useState(false)

  const status = profile?.membership_status
  const colors = statusToColors(status)

  const fullName =
    [profile?.first_name, profile?.middle_name, profile?.last_name].filter(Boolean).join(' ') ||
    '—'

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
      {/* 1. Main Flippable Card (Visible on Screen) */}
      <div
        className="relative mx-auto w-full max-w-sm"
        style={{ perspective: '1200px' }}
      >
        <div
          className="relative w-full"
          style={{ height: 200 }}
        >
          <div
            className="absolute inset-0 transition-transform duration-600"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* FRONT CARD CONTAINER */}
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: 'hidden' }}
            >
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

            {/* BACK CARD CONTAINER */}
            <div
              className="absolute inset-0"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
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

      {/* 2. Hidden Container for PNG Export (Renders front and back side-by-side) */}
      <div
        ref={exportRef}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '832px', // 384px * 2 + 24px gap + 20px padding * 2
          display: 'flex',
          flexDirection: 'row',
          gap: '24px',
          padding: '20px',
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

      {/* Action Buttons */}
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
