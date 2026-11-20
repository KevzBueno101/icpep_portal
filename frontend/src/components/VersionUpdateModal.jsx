import { useCallback, useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { APP_VERSION, RELEASE_NOTES, RELEASE_TITLE } from '../utils/appVersion'

const SEEN_VERSION_KEY = 'icpep_last_seen_version'

function hasSeenCurrentVersion() {
  try {
    return localStorage.getItem(SEEN_VERSION_KEY) === APP_VERSION
  } catch {
    return false
  }
}

function markVersionSeen() {
  try {
    localStorage.setItem(SEEN_VERSION_KEY, APP_VERSION)
  } catch {
    // Storage may be unavailable — the modal will simply show again next visit.
  }
}

export default function VersionUpdateModal() {
  const [isOpen, setIsOpen] = useState(() => !hasSeenCurrentVersion())

  const close = useCallback(() => {
    markVersionSeen()
    setIsOpen(false)
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="version-update-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5 dark:border-slate-800">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400">
                New version {APP_VERSION}
              </p>
              <h2 id="version-update-title" className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                {RELEASE_TITLE}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close update information"
            className="shrink-0 rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            The portal just got updated. Here’s what changed:
          </p>
          <ul className="mt-4 space-y-3">
            {RELEASE_NOTES.map((note) => (
              <li key={note} className="flex gap-3 text-sm text-slate-700 dark:text-slate-200">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={close}
            className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
