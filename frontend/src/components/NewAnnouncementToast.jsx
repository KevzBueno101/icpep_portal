import { useEffect, useRef, useState } from 'react'
import { BellRing, RefreshCw, X } from 'lucide-react'
import { EVENTS } from '../utils/events'

const AUTO_HIDE_MS = 10000

export default function NewAnnouncementToast() {
  const [notice, setNotice] = useState(null)
  const [eventKey, setEventKey] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const onNewAnnouncement = (event) => {
      setNotice({ title: event.detail?.title || '' })
      setEventKey((key) => key + 1)
    }
    window.addEventListener(EVENTS.NEW_ANNOUNCEMENT, onNewAnnouncement)
    return () => window.removeEventListener(EVENTS.NEW_ANNOUNCEMENT, onNewAnnouncement)
  }, [])

  useEffect(() => {
    if (!notice) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setNotice(null), AUTO_HIDE_MS)
    return () => clearTimeout(timerRef.current)
  }, [notice, eventKey])

  const handleReload = () => {
    if (spinning) return
    setSpinning(true)
    window.location.reload()
  }

  if (!notice) return null

  return (
    <div className="fixed bottom-24 right-4 z-[9999] w-[calc(100vw-2rem)] max-w-sm animate-slide-up sm:bottom-6">
      <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white shadow-xl dark:border-emerald-800/60 dark:bg-slate-800">
        <div className="flex items-start gap-3 p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
            <BellRing className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">New announcement posted</p>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {notice.title || 'A new announcement is now available.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            aria-label="Dismiss new announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={handleReload}
          className="flex w-full items-center justify-center gap-2 border-t border-slate-100 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-slate-700 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${spinning ? 'animate-spin' : ''}`} />
          Reload to see it
        </button>
      </div>
    </div>
  )
}
