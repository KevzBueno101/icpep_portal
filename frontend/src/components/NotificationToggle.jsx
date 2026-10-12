import { useCallback, useEffect, useState } from 'react'
import { BellOff, BellRing, Loader2 } from 'lucide-react'
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
      return
    }
    if (busy) return
    
    const previousStatus = status
    setBusy(true)
    
    // Optimistic UI update - move knob immediately
    if (status === STATUS.SUBSCRIBED) {
      setStatus(STATUS.IDLE)
    } else {
      setStatus(STATUS.SUBSCRIBED)
    }
    
    try {
      if (previousStatus === STATUS.SUBSCRIBED) {
        await disableNotifications()
        setStatus(STATUS.IDLE)
        toast.success('Notifications disabled.')
      } else {
        const result = await enableNotifications()
        if (!result) {
          setStatus(Notification.permission === 'denied' ? STATUS.DENIED : STATUS.IDLE)
        } else {
          setStatus(STATUS.SUBSCRIBED)
          toast.success('Notifications enabled. You will be alerted to new announcements.')
        }
      }
    } catch (err) {
      // Revert to previous state on error
      setStatus(previousStatus)
      const httpStatus = err?.response?.status
      if (httpStatus === 401) return
      if (httpStatus === 404 || httpStatus === 503) {
        return
      }
      const rawMessage = String(err?.message || '')
      if (
        /registration failed/i.test(rawMessage) ||
        /push service error/i.test(rawMessage) ||
        /notsupportederror/i.test(rawMessage) ||
        /an error occurred during registration/i.test(rawMessage)
      ) {
        return
      }
    } finally {
      setBusy(false)
    }
  }, [busy, status])

  if (!getAccessToken()) return null
  if (status === STATUS.UNSUPPORTED) return null

  const base =
    'relative inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/60'

  if (busy || status === STATUS.UNKNOWN) {
    return (
      <button
        type="button"
        disabled
        aria-label="Updating notification settings"
        className={`${base} cursor-wait text-slate-400 dark:text-slate-500 ${className}`}
      >
        <Loader2 className="h-5 w-5 animate-spin" />
      </button>
    )
  }

  if (status === STATUS.DENIED) {
    return (
      <button
        type="button"
        disabled
        title="Notifications are blocked in your browser settings"
        aria-label="Notifications are blocked in your browser settings"
        className={`${base} cursor-not-allowed text-slate-300 dark:text-slate-600 ${className}`}
      >
        <BellOff className="h-5 w-5" />
      </button>
    )
  }

  if (status === STATUS.SUBSCRIBED) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title="Turn off announcement notifications"
        aria-label="Turn off announcement notifications"
        className={`${base} bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 ${className}`}
      >
        <BellRing className="h-5 w-5 animate-bell-vibrate" />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      title="Get notified when a new announcement is posted"
      aria-label="Enable announcement notifications"
      className={`${base} text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 ${className}`}
    >
      <BellOff className="h-5 w-5" />
    </button>
  )
}
