import { QRCodeSVG } from 'qrcode.react'
import { certificateVerifyUrl } from '../../api/certificates'

// Page geometry copied from backend certificates/pdf.py (landscape A4, points).
const PAGE_W = 841.89
const PAGE_H = 595.28
const CONTENT_MARGIN = 70

// Symmetric vertical whitespace between the text and the top/bottom edges.
const EDGE_PADDING = 48
// Title baseline from the top edge (larger = more breathing room under the header).
const TITLE_TOP = 140
// Signature row (bottom band): up to 2 rows of 2 signatories.
const SIGNATORY_BASELINE = EDGE_PADDING
const SIGNATORY_COMPACT_BOTTOM = 34
const SIGNATORIES_PER_ROW = 2
const SIGNATORY_ROWS_MAX = 2
const SIG_IMG_MAX_W = 110
const SIGNATORY_CLEARANCE = 12
// QR verification block (bottom-right corner).
const QR_SIZE = 60
const QR_RIGHT_MARGIN = 28

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

// Horizontal centers for one signature row (max 2 per row) — mirrors pdf.py.
function rowXFractions(count, align) {
  let left
  let right
  if (align === 'left') {
    left = 0.18
    right = 0.44
  } else if (align === 'right') {
    left = 0.56
    right = 0.82
  } else {
    left = 0.30
    right = 0.70
  }
  if (count <= 0) return []
  if (count === 1) return [(left + right) / 2]
  const spacing = (right - left) / (count - 1)
  return Array.from({ length: count }, (_, i) => left + spacing * i)
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
    nodes.push({ text: line, y: PAGE_H - EDGE_PADDING - i * 13, size: 10, family: SANS, weight: 400, style: 'normal' })
  })

  let y = PAGE_H - TITLE_TOP
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

  // ---- Signatories (bottom band): 2 per row, max 2 rows --------------------
  // Mirrors pdf.py _draw_signatory_band: bottom-aligned, clamped so it never
  // overlaps the "held on" text above it.
  const signatories = (Array.isArray(design.signatories) ? design.signatories : [])
    .filter((s) => s && (s.name || s.position || s.signature_url))

  const chunked = []
  for (let i = 0; i < signatories.length; i += SIGNATORIES_PER_ROW) {
    chunked.push(signatories.slice(i, i + SIGNATORIES_PER_ROW))
  }
  let rows = chunked.slice(0, SIGNATORY_ROWS_MAX)

  const topClearance = y - SIGNATORY_CLEARANCE
  const imageGap = 4
  const rowGap = 8
  let nameGap = rows.length === 1 ? 16 : 13
  let bandBottom = rows.length === 1 ? SIGNATORY_BASELINE : SIGNATORY_COMPACT_BOTTOM
  let available = Math.max(0, topClearance - bandBottom)
  const textZone = () => nameGap + 13 + imageGap
  const fitHeight = (rowCount) => (available - (rowCount - 1) * rowGap) / rowCount - textZone()

  let imgH = fitHeight(rows.length)
  while (rows.length > 1 && imgH < 14) {
    rows = rows.slice(0, -1)
    nameGap = rows.length === 1 ? 16 : 13
    bandBottom = rows.length === 1 ? SIGNATORY_BASELINE : SIGNATORY_COMPACT_BOTTOM
    available = Math.max(0, topClearance - bandBottom)
    imgH = fitHeight(rows.length)
  }
  imgH = clamp(imgH, 14, 46)

  const bandRows = []
  let lineY = bandBottom + nameGap + 13
  rows.forEach((row) => {
    const xs = rowXFractions(row.length, align)
    const spacing = xs.length > 1 ? xs[1] - xs[0] : 0.26
    const imgW = clamp(PAGE_W * spacing * 0.7, 50, SIG_IMG_MAX_W)
    bandRows.push({ row, xs, lineY, imgW, imgH, nameGap, imageGap })
    lineY += imageGap + imgH + rowGap + nameGap + 13
  })

  // ---- QR / verify block (bottom-right) -----------------------------------
  const qrSize = QR_SIZE
  const qrLeft = PAGE_W - QR_RIGHT_MARGIN - qrSize
  const qrBottom = EDGE_PADDING

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

        {bandRows.map((r, ri) => r.row.map((sig, i) => {
          const cx = PAGE_W * r.xs[i]
          return (
            <g key={`${ri}-${i}`}>
              {sig.signature_url ? (
                <image
                  href={sig.signature_url}
                  x={cx - r.imgW / 2}
                  y={PAGE_H - (r.lineY + r.imageGap + r.imgH)}
                  width={r.imgW}
                  height={r.imgH}
                  preserveAspectRatio="xMidYMax meet"
                />
              ) : null}
              <text
                x={cx}
                y={PAGE_H - (r.lineY - r.nameGap)}
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
                y={PAGE_H - (r.lineY - r.nameGap - 13)}
                fill={textColor}
                fontFamily={SANS}
                fontSize={9.5}
                textAnchor="middle"
              >
                {(sig.position || '').toUpperCase()}
              </text>
            </g>
          )
        }))}

        {showQr ? (
          <text
            x={PAGE_W - QR_RIGHT_MARGIN - qrSize / 2}
            y={PAGE_H - (EDGE_PADDING - 12)}
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
