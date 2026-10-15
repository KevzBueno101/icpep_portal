import { QRCodeSVG } from 'qrcode.react'
import { certificateVerifyUrl } from '../../api/certificates'

// Page geometry copied from backend certificates/pdf.py (landscape A4, points).
const PAGE_W = 841.89
const PAGE_H = 595.28
const CONTENT_MARGIN = 70

const SERIF = "'Times New Roman', Times, serif"
const SANS = 'Helvetica, Arial, sans-serif'

const DEFAULT_SAMPLE = {
  memberName: 'Juan Dela Cruz',
  eventName: 'ICpE.P. Tech Summit 2026',
  eventDate: '2026-01-15',
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const clamp = (value, lo, hi) => Math.max(lo, Math.min(value, hi))

function formatDate(value) {
  if (!value) return ''
  const str = String(value)
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/)
  let year
  let month
  let day
  if (m) {
    year = Number(m[1])
    month = Number(m[2])
    day = Number(m[3])
  } else {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return str
    year = d.getFullYear()
    month = d.getMonth() + 1
    day = d.getDate()
  }
  return `${MONTHS[month - 1]} ${String(day).padStart(2, '0')}, ${year}`
}

function signatoryXFractions(count, align) {
  if (count <= 0) return []
  if (count === 1) return [align === 'center' ? 0.5 : align === 'left' ? 0.18 : 0.82]
  let left
  let right
  if (align === 'left') {
    left = 0.18
    right = 0.60
  } else if (align === 'right') {
    left = 0.40
    right = 0.82
  } else {
    left = 0.18
    right = 0.82
  }
  const spacing = Math.min((right - left) / (count - 1), 0.30)
  let start
  if (align === 'left') start = left
  else if (align === 'right') start = right - spacing * (count - 1)
  else start = 0.5 - (spacing * (count - 1)) / 2
  return Array.from({ length: count }, (_, i) => start + spacing * i)
}

let _measureCtx = null
function getMeasureContext() {
  if (typeof document === 'undefined') return null
  if (!_measureCtx) {
    _measureCtx = document.createElement('canvas').getContext('2d')
  }
  return _measureCtx
}

// Greedy word wrap that mirrors reportlab's _wrap_text for wrapping parity.
function wrapLines(text, family, size, weight, style, maxWidth) {
  const words = (text || '').split(/\s+/).filter(Boolean)
  if (!words.length) return []
  const ctx = getMeasureContext()
  if (!ctx) return [words.join(' ')]
  ctx.font = `${style} ${weight} ${size}px ${family}`
  const lines = []
  let current = ''
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word
    if (!current || ctx.measureText(trial).width <= maxWidth) current = trial
    else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

/**
 * Landscape certificate preview shared by the admin designer and the member
 * profile "View" action. Rendered as SVG using the same point coordinates as
 * the server-side PDF (landscape A4) so the layout matches the real output.
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

  const alignRaw = (design.text_align || 'CENTER').toLowerCase()
  const align = ['left', 'right', 'center'].includes(alignRaw) ? alignRaw : 'center'
  const anchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle'
  const anchorX = align === 'left' ? CONTENT_MARGIN : align === 'right' ? PAGE_W - CONTENT_MARGIN : PAGE_W / 2

  const base = clamp(Number(design.font_size) || 16, 11, 30)
  const titleSize = clamp(base * 2.2, 30, 52)
  const nameSize = clamp(base * 1.9, 24, 40)
  const eventSize = clamp(base + 4, 26)
  const eventLeading = clamp(base + 10, 32)
  const maxW = PAGE_W - 2 * CONTENT_MARGIN

  // ---- Vertical flow (baselines measured from the page bottom) ------------
  const nodes = []

  const headerLines = [design.header_school, design.header_college, design.header_organization]
    .map((line) => (line || '').trim())
    .filter(Boolean)
  headerLines.forEach((line, i) => {
    nodes.push({ text: line, y: PAGE_H - 46 - i * 13, size: 10, family: SANS, weight: 400, style: 'normal' })
  })

  let y = PAGE_H - 120
  nodes.push({
    text: (design.title || 'Certificate of Participation').toUpperCase(),
    y, size: titleSize, family: SERIF, weight: 700, style: 'normal',
  })
  y = y - titleSize - 30

  const messageLines = design.message
    ? wrapLines(design.message.trim(), SERIF, base, 400, 'normal', maxW)
    : []
  messageLines.forEach((line, i) => {
    nodes.push({ text: line, y: y - i * (base + 6), size: base, family: SERIF, weight: 400, style: 'normal' })
  })
  y = y - messageLines.length * (base + 6) - 14

  const presentedTo = (design.presented_to_text ?? 'This certificate is proudly presented to').trim()
  const presentedLines = presentedTo ? wrapLines(presentedTo, SANS, 11, 400, 'normal', maxW) : []
  presentedLines.forEach((line, i) => {
    nodes.push({ text: line, y: y - i * 14, size: 11, family: SANS, weight: 400, style: 'normal' })
  })
  y = presentedTo ? y - presentedLines.length * 14 - 32 : y - 46

  nodes.push({
    text: memberName || '', y, size: nameSize, family: SERIF, weight: 700, style: 'italic',
  })
  y = y - nameSize - 34

  const forText = (design.for_text ?? 'for participating in').trim()
  const forLines = forText ? wrapLines(forText, SANS, 11, 400, 'normal', maxW) : []
  forLines.forEach((line, i) => {
    nodes.push({ text: line, y: y - i * 14, size: 11, family: SANS, weight: 400, style: 'normal' })
  })
  y = forText ? y - forLines.length * 14 - 16 : y - 30

  const eventLines = eventName
    ? wrapLines(eventName, SERIF, eventSize, 700, 'normal', maxW)
    : []
  eventLines.forEach((line, i) => {
    nodes.push({ text: line, y: y - i * eventLeading, size: eventSize, family: SERIF, weight: 700, style: 'normal' })
  })
  y = y - eventLines.length * eventLeading - 12

  nodes.push({
    text: `held on ${formatDate(eventDate)}`, y, size: 10.5, family: SANS, weight: 400, style: 'normal',
  })

  // ---- Signatories (bottom band) ------------------------------------------
  const signatories = (Array.isArray(design.signatories) ? design.signatories : [])
    .filter((s) => s && (s.name || s.position || s.signature_url))
  const sigXs = signatoryXFractions(signatories.length, align)
  const sigSpacing = sigXs.length > 1 ? sigXs[1] - sigXs[0] : 0.30
  const sigImgW = clamp(PAGE_W * sigSpacing * 0.7, 70, 160)

  // ---- QR / verify block (bottom-right) -----------------------------------
  const qrSize = 68
  const qrLeft = PAGE_W - 40 - qrSize
  const qrBottom = 42

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
      style={{ aspectRatio: '297 / 210', color: textColor }}
    >
      {backgroundUrl ? (
        <img src={backgroundUrl} alt="" className="absolute inset-0 h-full w-full object-fill" />
      ) : (
        <div className="absolute inset-0 bg-white" />
      )}

      <svg
        viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        {nodes.map((node, i) => (
          <text
            key={i}
            x={anchorX}
            y={PAGE_H - node.y}
            fill={textColor}
            fontFamily={node.family}
            fontSize={node.size}
            fontWeight={node.weight}
            fontStyle={node.style}
            textAnchor={anchor}
          >
            {node.text}
          </text>
        ))}

        {signatories.map((sig, i) => {
          const cx = PAGE_W * sigXs[i]
          return (
            <g key={i}>
              {sig.signature_url ? (
                <image
                  href={sig.signature_url}
                  x={cx - sigImgW / 2}
                  y={PAGE_H - (154 + 46)}
                  width={sigImgW}
                  height={46}
                  preserveAspectRatio="xMidYMax meet"
                />
              ) : null}
              <text
                x={cx}
                y={PAGE_H - 134}
                fill={textColor}
                fontFamily={SERIF}
                fontSize={13}
                fontWeight={700}
                textAnchor="middle"
              >
                {sig.name || ''}
              </text>
              <text
                x={cx}
                y={PAGE_H - 121}
                fill={textColor}
                fontFamily={SANS}
                fontSize={9.5}
                textAnchor="middle"
              >
                {(sig.position || '').toUpperCase()}
              </text>
            </g>
          )
        })}

        {showQr ? (
          <text
            x={PAGE_W - 40 - qrSize / 2}
            y={PAGE_H - 32}
            fill={textColor}
            fontFamily={SANS}
            fontSize={6.5}
            textAnchor="end"
          >
            {`Verify: ${verificationCode}`}
          </text>
        ) : null}
      </svg>

      {showQr ? (
        <div
          className="absolute"
          style={{
            left: `${(qrLeft / PAGE_W) * 100}%`,
            top: `${((PAGE_H - (qrBottom + qrSize)) / PAGE_H) * 100}%`,
            width: `${(qrSize / PAGE_W) * 100}%`,
            height: `${(qrSize / PAGE_H) * 100}%`,
          }}
        >
          <QRCodeSVG
            value={certificateVerifyUrl(verificationCode)}
            size={qrSize}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      ) : null}
    </div>
  )
}
