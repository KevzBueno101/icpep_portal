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

  // Determine knob position based on state
  const knobPosition = status === STATUS.SUBSCRIBED ? 'translate-x-8' : 'translate-x-0'
  const loadingPosition = busy ? 'translate-x-4' : knobPosition

  if (busy || status === STATUS.UNKNOWN) {
    return (
      <div className={`relative inline-flex items-center w-16 h-8 rounded-full bg-gray-200 ${className}`}>
        <span className="absolute left-2 text-xs font-medium text-gray-500">Off</span>
        <span className="absolute right-2 text-xs font-medium text-gray-500">On</span>
        <div className={`absolute left-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center transition-transform duration-300 ${loadingPosition}`}>
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        </div>
      </div>
    )
  }

  if (status === STATUS.SUBSCRIBED) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={`relative inline-flex items-center w-16 h-8 rounded-full bg-green-500 transition-colors ${className}`}
        title="Turn off announcement notifications"
      >
        <span className="absolute left-2 text-xs font-medium text-white/50">Off</span>
        <span className="absolute right-2 text-xs font-medium text-white">On</span>
        <div className={`absolute left-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center transition-transform duration-300 ${busy ? 'translate-x-4' : 'translate-x-8'}`}>
          <BellRing className="h-4 w-4 text-green-500" />
        </div>
      </button>
    )
  }

  if (status === STATUS.DENIED) {
    return (
      <div
        className={`relative inline-flex items-center w-16 h-8 rounded-full bg-gray-200 cursor-not-allowed ${className}`}
        title="Notifications are blocked in your browser settings"
      >
        <span className="absolute left-2 text-xs font-medium text-white">Off</span>
        <span className="absolute right-2 text-xs font-medium text-gray-500">On</span>
        <div className="absolute left-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center transition-transform duration-300 translate-x-0">
          <BellOff className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`relative inline-flex items-center w-16 h-8 rounded-full bg-gray-200 transition-colors hover:bg-gray-300 ${className}`}
      title="Get notified when a new announcement is posted"
    >
      <span className="absolute left-2 text-xs font-medium text-white">Off</span>
      <span className="absolute right-2 text-xs font-medium text-gray-500">On</span>
      <div className={`absolute left-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center transition-transform duration-300 ${busy ? 'translate-x-4' : 'translate-x-0'}`}>
        <Bell className="h-4 w-4 text-gray-500" />
      </div>
    </button>
  )
}
