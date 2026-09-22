import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useRefresh } from '../context/RefreshContext'

export default function RefreshButton({ className = '' }) {
  const { needRefresh, clearRefresh } = useRefresh()
  const [spinning, setSpinning] = useState(false)

  const handleRefresh = () => {
    if (spinning) return
    setSpinning(true)
    clearRefresh()
    if (!('serviceWorker' in navigator)) {
      window.location.reload()
      return
    }
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (registration?.waiting) {
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload()
          })
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          setTimeout(() => window.location.reload(), 3000)
        } else {
          window.location.reload()
        }
      })
      .catch(() => window.location.reload())
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      className={`relative inline-flex items-center justify-center rounded-md p-2 text-slate-700/90 transition hover:bg-sky-100/50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-400 ${className}`}
      title="Refresh page"
      aria-label="Refresh page"
    >
      <RefreshCw className={`h-5 w-5 ${spinning ? 'animate-spin' : ''}`} />
      {needRefresh && (
        <>
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="sr-only">New updates available</span>
        </>
      )}
    </button>
  )
}