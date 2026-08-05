import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getAccessToken } from '../api/axios'
import {
  disableNotifications,
  enableNotifications,
  getSubscriptionStatus,
  isPushSupported,
} from '../utils/notifications'

const STATUS = {
  UNKNOWN: 'unknown',
  SUBSCRIBED: 'subscribed',
  IDLE: 'idle',
  DENIED: 'denied',
  UNSUPPORTED: 'unsupported',
}

export default function NotificationToggle({ className = '' }) {
  const [status, setStatus] = useState(STATUS.UNKNOWN)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true

    const init = async () => {
      if (!isPushSupported()) {
        setStatus(STATUS.UNSUPPORTED)
        return
      }
      const subscription = await getSubscriptionStatus()
      if (!active) return
      if (subscription) {
        setStatus(STATUS.SUBSCRIBED)
      } else if (Notification.permission === 'denied') {
        setStatus(STATUS.DENIED)
      } else {
        setStatus(STATUS.IDLE)
      }
    }

    init()
    return () => {
      active = false
    }
  }, [])

  const handleToggle = useCallback(async () => {
    if (!getAccessToken()) {
      toast('Log in to enable notifications.')
      return
    }
    if (busy) return
    setBusy(true)
    try {
      if (status === STATUS.SUBSCRIBED) {
        await disableNotifications()
        setStatus(STATUS.IDLE)
        toast.success('Notifications disabled.')
      } else {
        const result = await enableNotifications()
        if (!result) {
          setStatus(Notification.permission === 'denied' ? STATUS.DENIED : STATUS.IDLE)
          toast('Notification permission was not granted.')
        } else {
          setStatus(STATUS.SUBSCRIBED)
          toast.success('Notifications enabled. You will be alerted to new announcements.')
        }
      }
    } catch (err) {
      const status = err?.response?.status
      if (status === 401) return
      if (status === 404 || status === 503) {
        toast.error(
          'Push notifications are not available on the server right now. Please try again later.'
        )
        return
      }
      toast.error(err?.message || 'Failed to update notification settings.')
    } finally {
      setBusy(false)
    }
  }, [busy, status])

  if (!getAccessToken()) return null
  if (status === STATUS.UNSUPPORTED) return null

  const baseClasses =
    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ' +
    className

  if (busy || status === STATUS.UNKNOWN) {
    return (
      <span className={`${baseClasses} border-slate-200 bg-white text-slate-500`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Checking...</span>
      </span>
    )
  }

  if (status === STATUS.SUBSCRIBED) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`${baseClasses} border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
        title="Turn off announcement notifications"
      >
        <BellRing className="h-4 w-4" />
        <span>Notifications On</span>
      </button>
    )
  }

  if (status === STATUS.DENIED) {
    return (
      <span
        className={`${baseClasses} cursor-not-allowed border-slate-200 bg-white text-slate-400`}
        title="Notifications are blocked in your browser settings"
      >
        <BellOff className="h-4 w-4" />
        <span>Notifications Blocked</span>
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`${baseClasses} border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100`}
      title="Get notified when a new announcement is posted"
    >
      <Bell className="h-4 w-4" />
      <span>Enable Notifications</span>
    </button>
  )
}
