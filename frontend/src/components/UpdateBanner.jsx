import { useEffect, useState } from 'react'
import { BellRing, X } from 'lucide-react'
import { useRefresh } from '../context/RefreshContext'
import RefreshButton from './RefreshButton'
import { EVENTS } from '../utils/events'
import { ANNOUNCEMENT_UPDATED_EVENT, ANNOUNCEMENT_DELETED_EVENT } from '../utils/announcementEvents'

const AUTO_HIDE_MS = 6000
const CONTENT_LABELS = {
  [EVENTS.MEMBER_LIST_UPDATED]: 'Member records were updated',
  [EVENTS.ANNOUNCEMENTS_UPDATED]: 'Announcements were updated',
  [ANNOUNCEMENT_UPDATED_EVENT]: 'Announcements were updated',
  [ANNOUNCEMENT_DELETED_EVENT]: 'Announcements were updated',
  [EVENTS.PAYMENT_SETTINGS_UPDATED]: 'Payment settings were updated',
  [EVENTS.PROFILE_UPDATED]: 'A profile was updated',
  [EVENTS.OFFICERS_REFRESH]: 'Officers roster was updated',
}

export default function UpdateBanner() {
  const { needRefresh, needContentRefresh, changeLabel, changeCount, triggerContentRefresh } = useRefresh()
  const [dismissedFor, setDismissedFor] = useState(null)

  useEffect(() => {
    const onChange = (event) => {
      const label = CONTENT_LABELS[event.type]
      if (label) triggerContentRefresh(label)
    }

    Object.keys(CONTENT_LABELS).forEach((type) => window.addEventListener(type, onChange))
    return () => {
      Object.keys(CONTENT_LABELS).forEach((type) => window.removeEventListener(type, onChange))
    }
  }, [triggerContentRefresh])

  const visible = (needRefresh || needContentRefresh) && dismissedFor !== changeCount

  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => setDismissedFor(changeCount), AUTO_HIDE_MS)
    return () => clearTimeout(timer)
  }, [visible, changeCount])

  if (!visible) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm shadow-sm animate-slide-up dark:border-sky-800/60 dark:bg-sky-950/40">
      <BellRing className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" />
      <span className="min-w-0 flex-1 truncate font-medium text-slate-700 dark:text-slate-200">
        {changeLabel || 'New updates are available'}
      </span>
      <RefreshButton hideBadge className="shrink-0 hover:bg-sky-100 dark:hover:bg-slate-800" />
      <button
        type="button"
        onClick={() => setDismissedFor(changeCount)}
        className="shrink-0 rounded-md p-1 text-slate-400 transition hover:bg-sky-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}