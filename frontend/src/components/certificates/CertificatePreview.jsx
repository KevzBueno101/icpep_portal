import { QRCodeSVG } from 'qrcode.react'
import { certificateVerifyUrl } from '../../api/certificates'

const DEFAULT_SAMPLE = {
  memberName: 'Juan Dela Cruz',
  eventName: 'ICpE.P. Tech Summit 2026',
  eventDate: '2026-01-15',
}

const SIGNATURE_POSITIONS = {
  left: { single: '20%', double: ['20%', '47%'] },
  center: { single: '50%', double: ['32%', '68%'] },
  right: { single: '80%', double: ['53%', '80%'] },
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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
  const signatureUrl = design.signature_url || design.signature_image || ''
  const textColor = design.text_color || '#0f172a'
  const scale = Math.min(1.6, Math.max(0.8, (Number(design.font_size) || 16) / 16))
  const secondName = design.second_signatory_name || ''

  const alignRaw = (design.text_align || 'CENTER').toLowerCase()
  const align = ['left', 'right', 'center'].includes(alignRaw) ? alignRaw : 'center'
  const sigPos = SIGNATURE_POSITIONS[align]

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
        {secondName ? (
          <>
            <Signatory
              left={sigPos.double[0]}
              name={design.signatory_name}
              position={design.signatory_position}
              signatureUrl={signatureUrl}
              color={textColor}
              em={em}
            />
            <Signatory
              left={sigPos.double[1]}
              name={secondName}
              position={design.second_signatory_position}
              color={textColor}
              em={em}
            />
          </>
        ) : (
          <Signatory
            left={sigPos.single}
            name={design.signatory_name}
            position={design.signatory_position}
            signatureUrl={signatureUrl}
            color={textColor}
            em={em}
          />
        )}

        {showQr ? (
          <div className="absolute" style={{ right: '2.5%', bottom: '3%' }}>
            <QRCodeSVG value={certificateVerifyUrl(verificationCode)} size={64} />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Signatory({ left, name, position, signatureUrl, color, em }) {
  return (
    <div
      className="absolute w-[30%] -translate-x-1/2 text-center"
      style={{ left, top: '78%', color }}
    >
      <div className="relative flex h-[26px] items-end justify-center">
        {signatureUrl ? (
          <img
            src={signatureUrl}
            alt=""
            className="absolute bottom-0 max-h-[26px] max-w-[70%] object-contain"
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
