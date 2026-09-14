import { useEffect, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'

const UPDATE_CHECK_INTERVAL = 60_000

export default function UpdateNotice() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const registrationRef = useRef(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let cancelled = false

    const markUpdateAvailable = (worker) => {
      if (worker && worker.state === 'installed' && navigator.serviceWorker.controller) {
        if (!cancelled) setNeedRefresh(true)
      }
    }

    const watchRegistration = (registration) => {
      const watchInstalling = (worker) => {
        worker.addEventListener('statechange', () => markUpdateAvailable(worker))
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
          if (registration) registration.update()
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
  }, [])

  // Once the fresh service worker takes control, reload to load the new build.
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const onControllerChange = () => window.location.reload()
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () =>
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
  }, [])

  const handleRefresh = () => {
    const registration = registrationRef.current
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    } else {
      window.location.reload()
    }
  }

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-6 right-4 z-[70] w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-[#1f2937] bg-[#0f0f18] p-5 text-[#e5e7eb] shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
          <RefreshCw className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold">New update available</h3>
          <p className="mt-1 text-xs text-slate-400">
            A new version of ICPEP Portal was just deployed. Refresh to see the latest changes.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-bold text-white hover:bg-sky-500 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh now
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}