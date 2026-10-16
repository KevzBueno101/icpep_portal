import { useState, useRef, useCallback } from 'react'
import { useOfficers } from '../../context/OfficersContext'
import EmptyLeadershipState from '../../components/EmptyLeadershipState'

const SWIPE_THRESHOLD = 40
const DRAG_CAPTURE_THRESHOLD = 10

export default function OfficersCoverflow() {
  const [error, setError] = useState(null)
  const [active, setActive] = useState(0)
  const [imgFailed, setImgFailed] = useState(() => new Set())
  const optionRefs = useRef([])
  const pointerRef = useRef({ startX: 0, active: false, captured: false })
  const justSwipedRef = useRef(false)

  let officers = []
  let officersLoading = false
  let refreshOfficers = () => {}

  try {
    const value = useOfficers()
    officers = value.officers || []
    officersLoading = !!value.officersLoading
    refreshOfficers = value.refreshOfficers || (() => {})
  } catch (e) {
    console.error('[OfficersCoverflow] OfficersContext unavailable:', e)
    setError('Unable to load leadership directory. Please try again later.')
  }

  const validOfficers = officers.filter((officer) => {
    const activeOk = officer.isActive === undefined ? true : !!officer.isActive
    return activeOk && !!officer.fullName && officer.fullName !== '-' && !!officer.position
  })

  const lastIndex = validOfficers.length - 1
  const current = lastIndex >= 0 ? Math.min(active, lastIndex) : 0
  const activeOfficer = lastIndex >= 0 ? validOfficers[current] : null

  const select = useCallback(
    (next, opts = {}) => {
      if (lastIndex < 0) return
      const clamped = Math.max(0, Math.min(next, lastIndex))
      setActive(clamped)
      if (opts.focus) optionRefs.current[clamped]?.focus({ preventScroll: true })
    },
    [lastIndex]
  )

  const coverStyle = (i) => {
    const d = i - current
    const ad = Math.abs(d)
    const s = Math.sign(d)
    const transform =
      ad === 0
        ? 'translateX(0) translateZ(40px) rotateY(0deg)'
        : `translateX(${s * (48 + (ad - 1) * 20)}%) translateZ(${
            -120 - ad * 40
          }px) rotateY(${-s * 58}deg)`
    return {
      transform,
      zIndex: 10 - ad,
      opacity: ad > 2 ? 0 : 1,
      pointerEvents: ad > 2 ? 'none' : 'auto',
    }
  }

  const handleListKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      select(current - 1, { focus: true })
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      select(current + 1, { focus: true })
    } else if (e.key === 'Home') {
      e.preventDefault()
      select(0, { focus: true })
    } else if (e.key === 'End') {
      e.preventDefault()
      select(lastIndex, { focus: true })
    }
  }

  const handleOptionKeyDown = (e, i) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      select(i)
    }
  }

  const handleCoverClick = (i) => {
    if (justSwipedRef.current) {
      justSwipedRef.current = false
      return
    }
    select(i)
  }

  const handlePointerDown = (e) => {
    if (!e.isPrimary) return
    pointerRef.current = {
      startX: e.clientX,
      active: true,
      captured: false,
    }
  }

  const handlePointerMove = (e) => {
    const p = pointerRef.current
    if (!p.active) return
    const dx = e.clientX - p.startX
    if (!p.captured && Math.abs(dx) > DRAG_CAPTURE_THRESHOLD) {
      p.captured = true
      e.currentTarget.setPointerCapture?.(e.pointerId)
    }
  }

  const handlePointerUp = (e) => {
    const p = pointerRef.current
    if (!p.active) return
    p.active = false
    const dx = e.clientX - p.startX
    if (Math.abs(dx) >= SWIPE_THRESHOLD) {
      justSwipedRef.current = true
      window.setTimeout(() => {
        justSwipedRef.current = false
      }, 300)
      select(dx < 0 ? current + 1 : current - 1)
    }
  }

  const handlePointerCancel = () => {
    pointerRef.current.active = false
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-8 text-center sm:p-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-red-900">
          Unable to Load Officers Directory
        </h3>
        <p className="mb-4 text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={() => {
            setError(null)
            refreshOfficers()
          }}
          className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Try Again
        </button>
      </div>
    )
  }

  if (officersLoading && validOfficers.length === 0) {
    return (
      <div className="flex justify-center gap-6" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-56 w-40 animate-pulse rounded-2xl bg-slate-100 sm:w-48"
          />
        ))}
      </div>
    )
  }

  if (validOfficers.length === 0) {
    return <EmptyLeadershipState />
  }

  return (
    <div>
      <div
        className="od-stage"
        role="listbox"
        aria-label="Officers"
        onKeyDown={handleListKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {validOfficers.map((officer, i) => {
          const isActive = i === current
          const d = Math.abs(i - current)
          const hasImg = !!officer.avatarUrl && !imgFailed.has(officer.id)
          return (
            <div
              key={officer.id}
              ref={(el) => {
                optionRefs.current[i] = el
              }}
              role="option"
              aria-selected={isActive}
              aria-label={`${officer.fullName} — ${officer.position}`}
              tabIndex={d > 2 ? -1 : 0}
              style={coverStyle(i)}
              className={`od-cover shadow-lg ring-1 ring-black/5 ${
                isActive ? 'is-active' : ''
              }`}
              onClick={() => handleCoverClick(i)}
              onKeyDown={(e) => handleOptionKeyDown(e, i)}
            >
              {hasImg ? (
                <img
                  src={officer.avatarUrl}
                  alt={`${officer.fullName}, ${officer.position}`}
                  className="h-full w-full object-cover"
                  draggable={false}
                  loading="lazy"
                  onError={() =>
                    setImgFailed((prev) => new Set(prev).add(officer.id))
                  }
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-700 to-indigo-800">
                  <span className="text-5xl font-bold text-white" aria-hidden="true">
                    {(officer.fullName || 'IC')
                      .trim()
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase() || 'IC'}
                  </span>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3 pt-8">
                <p className="truncate text-sm font-bold text-white">
                  {officer.fullName}
                </p>
                <p className="truncate text-xs font-medium text-sky-200">
                  {officer.position}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="od-caption" aria-live="polite">
        {activeOfficer && (
          <div key={activeOfficer.id}>
            <p className="od-title">{activeOfficer.fullName}</p>
            <p className="od-artist">{activeOfficer.position}</p>
          </div>
        )}
      </div>
    </div>
  )
}
