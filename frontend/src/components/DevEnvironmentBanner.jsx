import { AlertTriangle } from 'lucide-react'

export default function DevEnvironmentBanner() {
  const isDev = import.meta.env.VITE_APP_ENV === 'development'

  if (!isDev) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white text-center py-2 text-sm font-semibold shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        <span>This is a test version (development environment)</span>
      </div>
    </div>
  )
}
