import React, { useMemo, useRef, useState } from 'react'
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

/* ─── Display Card ─────────────────────────────────────────────────────── */

const DisplayCard = React.forwardRef(function DisplayCard({ qrPayload, fullName, position, yearText, officerId, profilePictureUrl, avatarInitial }, ref) {
  return (
    <div
      ref={ref}
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
              src="/icpep_logo.jpg"
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
          <div className="text-center mt-10">
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
              <QRCodeSVG value={qrPayload} size={64} includeMargin={false} fgColor={C.navy} />
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
})

/* ─── Main Component ────────────────────────────────────────────────────── */

export default function OfficerIdCard({ profile, user }) {
  const cardRef = useRef(null)
  const [saving, setSaving] = useState(false)

  const fullName = useMemo(() => {
    return [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Authorized Officer'
  }, [profile])

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

  const loadImg = (src) => new Promise((resolve) => {
    if (!src) { resolve(null); return }
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

  const saveAsPng = async () => {
    try {
      setSaving(true)

      const S = 3
      const W = CARD_W * S
      const H = CARD_H * S
      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      const X = (v) => v * S

      const rr = (cx, cy, cw, ch, r) => {
        const rx = X(r), x = X(cx), y = X(cy), w = X(cw), h = X(ch)
        ctx.beginPath()
        ctx.moveTo(x + rx, y)
        ctx.lineTo(x + w - rx, y)
        ctx.quadraticCurveTo(x + w, y, x + w, y + rx)
        ctx.lineTo(x + w, y + h - rx)
        ctx.quadraticCurveTo(x + w, y + h, x + w - rx, y + h)
        ctx.lineTo(x + rx, y + h)
        ctx.quadraticCurveTo(x, y + h, x, y + h - rx)
        ctx.lineTo(x, y + rx)
        ctx.quadraticCurveTo(x, y, x + rx, y)
        ctx.closePath()
      }

      const [icpep, cea, prof] = await Promise.all([
        loadImg('/icpep_logo.jpg'),
        loadImg('/cea-logo.png'),
        loadImg(profilePictureUrl),
      ])

      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: X(80), margin: 0, color: { dark: C.navy, light: '#ffffff' },
      })
      const qrImg = await loadImg(qrDataUrl)

      ctx.save()
      rr(0, 0, CARD_W, CARD_H, 28)
      ctx.clip()

      ctx.fillStyle = C.white
      ctx.fillRect(0, 0, X(CARD_W), X(CARD_H))

      const navyH = 0.35 * H
      const grad = ctx.createLinearGradient(0, 0, X(CARD_W), navyH)
      grad.addColorStop(0, '#0B1830')
      grad.addColorStop(0.4, '#132244')
      grad.addColorStop(1, '#1C3B6B')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, X(CARD_W), navyH)

      const accent = (hex, a) => {
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
        ctx.fillStyle = `rgba(${r},${g},${b},${a})`
      }

      const LS = (size) => S * size
      const TX = (size, weight, color, align, baseline) => {
        ctx.font = `${weight || 'normal'} ${LS(size)}px Arial,sans-serif`
        ctx.fillStyle = color
        ctx.textAlign = align || 'center'
        ctx.textBaseline = baseline || 'top'
      }

      const diagY = navyH * 0.59 / S
      accent('#2B7BE4', 0.12)
      ctx.beginPath()
      ctx.moveTo(0, X(diagY))
      ctx.lineTo(X(CARD_W), X(diagY + CARD_W * 0.05))
      ctx.lineTo(X(CARD_W), X(diagY + CARD_W * 0.1))
      ctx.lineTo(0, X(diagY + CARD_W * 0.05))
      ctx.closePath()
      ctx.fill()

      // header logos + text
      const lY = X(16), lS = X(48), lGap = X(4)
      if (icpep) {
        ctx.save(); ctx.beginPath(); ctx.arc(lY + lS/2, lY + lS/2, lS/2, 0, Math.PI*2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.clip()
        ctx.drawImage(icpep, lY, lY, lS, lS); ctx.restore()
      }
      if (cea) {
        const cx = X(CARD_W) - lY - lS
        ctx.save(); ctx.beginPath(); ctx.arc(cx + lS/2, lY + lS/2, lS/2, 0, Math.PI*2); ctx.clip()
        ctx.drawImage(cea, cx, lY, lS, lS); ctx.restore()
      }

      const textCX = X(CARD_W) / 2
      TX(7.5, '700', 'rgba(255,255,255,0.9)')
      ctx.fillText('Institute of Computer Engineers of the Philippines - Student Edition', textCX, lY + LS(2), X(CARD_W - 130))
      TX(6.5, '600', 'rgba(191,219,254,0.8)')
      ctx.fillText('College of Engineering and Architecture', textCX, lY + LS(16), X(CARD_W - 130))
      TX(6, '700', 'rgba(147,197,253,0.7)')
      ctx.fillText('CATANDUANES STATE UNIVERSITY', textCX, lY + LS(30), X(CARD_W - 130))

      // profile photo
      const pCX = X(CARD_W) / 2, pY = X(0.35 * CARD_H), pS = X(88), pHalf = pS / 2
      ctx.save()
      ctx.beginPath()
      ctx.arc(pCX, pY, pHalf, 0, Math.PI * 2)
      ctx.fillStyle = C.cardBg
      ctx.fill()
      ctx.lineWidth = X(3)
      ctx.strokeStyle = '#fff'
      ctx.stroke()
      ctx.clip()
      if (prof) {
        ctx.drawImage(prof, pCX - pHalf, pY - pHalf, pS, pS)
      } else {
        ctx.restore()
        ctx.save()
        ctx.beginPath()
        ctx.arc(pCX, pY, pHalf, 0, Math.PI * 2)
        ctx.clip()
        ctx.fillStyle = C.cardBg
        ctx.fill()
        ctx.restore()
        ctx.save()
        TX(24, '900', C.slate, 'center', 'middle')
        ctx.fillText(avatarInitial, pCX, pY)
      }
      ctx.restore()

      // name + position
      const nameTop = pY + pHalf + X(14)
      TX(8, '700', C.accent)
      ctx.fillText('OFFICER', textCX, nameTop)

      const nSize = LS(18)
      TX(18, '900', C.navy, 'center', 'top')
      ctx.fillText(fullName, textCX, nameTop + nSize + LS(4), X(CARD_W - 48))

      const divY = nameTop + nSize + LS(4) + X(6) + LS(18) + X(14)
      const gradLine = ctx.createLinearGradient(textCX - LS(24), divY, textCX + LS(24), divY)
      gradLine.addColorStop(0, 'transparent')
      gradLine.addColorStop(0.5, C.accent)
      gradLine.addColorStop(1, 'transparent')
      ctx.fillStyle = gradLine
      ctx.fillRect(textCX - LS(24), divY, LS(48), LS(1))

      TX(11, '700', C.royal, 'center', 'top')
      ctx.fillText(profile?.position || '\u2014', textCX, divY + LS(10))

      // qr section — centered group (text + QR)
      const qrY = divY + LS(28)
      const qrH = X(84)
      rr(24, qrY/S, CARD_W - 48, 84, 18)
      const qGrad = ctx.createLinearGradient(0, qrY, 0, qrY + qrH)
      qGrad.addColorStop(0, C.cardBg)
      qGrad.addColorStop(1, '#fff')
      ctx.fillStyle = qGrad
      ctx.fill()

      if (qrImg) {
        const qs = X(64)
        const qrText1 = 'ICpEP.SE'
        const qrText2 = "Officer's ID Card"

        TX(7, '700', C.slate, 'left')
        const tw1 = ctx.measureText(qrText1).width
        TX(9, '600', C.slate, 'left')
        const tw2 = ctx.measureText(qrText2).width
        const textW = Math.max(tw1, tw2)
        const gap = LS(12)
        const totalW = textW + gap + qs
        const groupLeft = textCX - totalW / 2

        TX(7, '700', C.slate, 'left')
        ctx.fillText(qrText1, groupLeft, qrY + X(14))
        TX(9, '600', C.slate, 'left')
        ctx.fillText(qrText2, groupLeft, qrY + X(28))
        ctx.drawImage(qrImg, groupLeft + textW + gap, qrY + (qrH - qs) / 2, qs, qs)
      }

      const footY = X(CARD_H) - X(10)
      TX(7.5, 'normal', '#94A3B8', 'center', 'bottom')
      ctx.font = `italic ${LS(7.5)}px Arial,sans-serif`
      ctx.fillText('Official verification pass \u2014 valid for the current academic year', textCX, footY)

      ctx.restore()

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Download failed: Could not generate image.')
          return
        }
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `ICpEP_Officer_Card_${officerId || 'officer'}.png`
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (err) {
      console.error('Canvas rendering error:', err)
      alert('Download failed: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-full flex flex-col items-center p-4">
      <div className="w-full overflow-x-auto flex justify-center">
        <DisplayCard
          ref={cardRef}
          qrPayload={qrPayload}
          fullName={fullName}
          position={profile?.position || ''}
          yearText={''}
          officerId={officerId}
          profilePictureUrl={profilePictureUrl}
          avatarInitial={avatarInitial}
        />
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
