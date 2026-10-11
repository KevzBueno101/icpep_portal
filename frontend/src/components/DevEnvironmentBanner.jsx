import { useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function DevEnvironmentBanner() {
  const isDev = import.meta.env.VITE_APP_ENV === 'development'
  const [isVisible, setIsVisible] = useState(true)

  if (!isDev || !isVisible) return null

  return (
    <div className="bg-amber-500/15 text-white text-center py-2 text-sm font-semibold shadow-lg backdrop-blur-sm relative">
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>This is a test version (development environment)</span>
      </div>
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition"
        aria-label="Close banner"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
