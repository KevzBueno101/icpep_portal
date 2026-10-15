import { QRCodeSVG } from 'qrcode.react'
import { certificateVerifyUrl } from '../../api/certificates'

const DEFAULT_SAMPLE = {
  memberName: 'Juan Dela Cruz',
  eventName: 'ICpE.P. Tech Summit 2026',
  eventDate: '2026-01-15',
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function signatoryXFractions(count, align) {
  if (count <= 0) return []
  if (count === 1) return [align === 'center' ? '50%' : align === 'left' ? '18%' : '82%']
  let left
  let right
  if (align === 'left') {
    left = 18
    right = 60
  } else if (align === 'right') {
    left = 40
    right = 82
  } else {
    left = 18
    right = 82
  }
  const spacing = Math.min((right - left) / (count - 1), 30)
  let start
  if (align === 'left') start = left
  else if (align === 'right') start = right - spacing * (count - 1)
  else start = 50 - (spacing * (count - 1)) / 2
  return Array.from({ length: count }, (_, i) => `${start + spacing * i}%`)
}

/**
 * Landscape certificate preview shared by the admin designer and the member
 * profile "View" action. Renders an HTML approximation of the fixed layout
 * used by the server-side PDF (landscape A4).
 */
export default function CertificatePreview({
  design = {},
  memberName = DEFAULT_SAMPLE.memberName,
  eventName = DEFAULT_SAMPLE.eventName,
  eventDate = DEFAULT_SAMPLE.eventDate,
  verificationCode = 'ICPEP-SAMPLE',
  showQr = true,
  className = '',
}) {
  const backgroundUrl = design.background_url || design.background_image || ''
  const textColor = design.text_color || '#0f172a'
  const scale = Math.min(1.6, Math.max(0.8, (Number(design.font_size) || 16) / 16))

  const alignRaw = (design.text_align || 'CENTER').toLowerCase()
  const align = ['left', 'right', 'center'].includes(alignRaw) ? alignRaw : 'center'

  const signatories = (Array.isArray(design.signatories) ? design.signatories : [])
    .filter((s) => s && (s.name || s.position || s.signature_url))
  const sigXs = signatoryXFractions(signatories.length, align)
  const sigWidth = signatories.length <= 2 ? 30 : Math.max(12, Math.round(60 / signatories.length))

  const em = (factor) => `${(factor * scale).toFixed(3)}em`

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
      style={{ aspectRatio: '297 / 210', color: textColor, fontSize: 'clamp(6px, 1.15vw, 15px)' }}
    >
      {backgroundUrl ? (
        <img
          src={backgroundUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-white" />
      )}

      <div className="absolute inset-0">
        <div className="absolute" style={{ left: '8%', right: '8%', top: 0, bottom: 0, textAlign: align }}>
          <div
            className="absolute"
            style={{ left: 0, right: 0, top: '3%', fontSize: em(0.52), lineHeight: 1.35 }}
          >
            {design.header_school ? <div>{design.header_school}</div> : null}
            {design.header_college ? <div>{design.header_college}</div> : null}
            {design.header_organization ? <div>{design.header_organization}</div> : null}
          </div>

          <div
            className="absolute font-semibold uppercase tracking-wide"
            style={{ left: 0, right: 0, top: '10%', fontSize: em(1.9) }}
          >
            {design.title || 'Certificate of Participation'}
          </div>

          {design.message ? (
            <div
              className="absolute leading-snug"
              style={{ left: 0, right: 0, top: '23.5%', fontSize: em(0.85) }}
            >
              {design.message}
            </div>
          ) : null}

          <div
            className="absolute uppercase tracking-wide"
            style={{ left: 0, right: 0, top: '38%', fontSize: em(0.72) }}
          >
            This certificate is proudly presented to
          </div>

          <div
            className="absolute font-semibold italic"
            style={{ left: 0, right: 0, top: '44%', fontSize: em(1.5) }}
          >
            {memberName || ''}
          </div>

          <div
            className="absolute uppercase tracking-wide"
            style={{ left: 0, right: 0, top: '57.5%', fontSize: em(0.72) }}
          >
            for participating in
          </div>

          <div
            className="absolute font-semibold"
            style={{ left: 0, right: 0, top: '63%', fontSize: em(1.15) }}
          >
            {eventName || ''}
          </div>

          <div
            className="absolute"
            style={{ left: 0, right: 0, top: '71.5%', fontSize: em(0.7) }}
          >
            held on {formatDate(eventDate)}
          </div>
        </div>

        {/* Signatories */}
        {signatories.map((sig, i) => (
          <Signatory
            key={i}
            left={sigXs[i]}
            width={sigWidth}
            name={sig.name}
            position={sig.position}
            signatureUrl={sig.signature_url}
            color={textColor}
            em={em}
          />
        ))}

        {showQr ? (
          <div className="absolute" style={{ right: '2.5%', bottom: '3%' }}>
            <QRCodeSVG value={certificateVerifyUrl(verificationCode)} size={64} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Signatory({ left, width = 30, name, position, signatureUrl, color, em }) {
  return (
    <div
      className="absolute -translate-x-1/2 text-center"
      style={{ left, top: '78%', width: `${width}%`, color }}
    >
      <div className="relative flex h-[26px] items-end justify-center">
        {signatureUrl ? (
          <img
            src={signatureUrl}
            alt=""
            className="absolute bottom-0 max-h-[26px] max-w-[80%] object-contain"
          />
        ) : null}
      </div>
      <div className="truncate font-semibold" style={{ fontSize: em(0.78) }}>
        {name || '—'}
      </div>
      <div className="truncate uppercase tracking-wide" style={{ fontSize: em(0.62), opacity: 0.85 }}>
        {position || ''}
      </div>
    </div>
  )
}
