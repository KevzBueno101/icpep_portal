import { useEffect, useRef } from 'react'
import { useRefresh } from '../context/RefreshContext'

const UPDATE_CHECK_INTERVAL = 60_000

const wasJustAcknowledged = () => {
  try {
    const at = Number(localStorage.getItem('icpep_update_acknowledged_at'))
    if (!at || Date.now() - at > 10000) return false
    localStorage.removeItem('icpep_update_acknowledged_at')
    return true
  } catch {
    return false
  }
}

export default function UpdateNotice() {
  const { triggerRefresh } = useRefresh()
  const registrationRef = useRef(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let cancelled = false

    const markUpdateAvailable = () => {
      if (!cancelled) triggerRefresh()
    }

    const watchRegistration = (registration) => {
      const watchInstalling = (worker) => {
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && (navigator.serviceWorker.controller || registration.active)) {
            markUpdateAvailable()
          }
        })
      }

      // A freshly-installed waiting worker right after a user-initiated refresh
      // (or the mount right after reload) is the one they already acted on — do
      // not re-trigger the red dot for it.
      if (!wasJustAcknowledged() && registration.waiting) {
        markUpdateAvailable()
      }

      if (registration.installing) {
        watchInstalling(registration.installing)
      }
      registration.addEventListener('updatefound', () => {
        if (registration.installing) watchInstalling(registration.installing)
      })
    }

    const checkForUpdate = () => {
      navigator.serviceWorker
        .getRegistration()
        .then((registration) => {
          if (!registration) return
          if (registration.waiting) {
            markUpdateAvailable()
            return
          }
          registration.update().catch(() => {})
        })
        .catch(() => {})
    }

    navigator.serviceWorker
      .getRegistration()
      .then((existing) => {
        if (cancelled) return
        if (existing) {
          registrationRef.current = existing
          watchRegistration(existing)
          return
        }
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            if (cancelled) return
            registrationRef.current = registration
            watchRegistration(registration)
          })
          .catch(() => {})
      })
      .catch(() => {})

    const interval = setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL)
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkForUpdate()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      cancelled = true
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [triggerRefresh])

  return null
}