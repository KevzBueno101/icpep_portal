import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

export default function NetworkStatus() {
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-up">
      <div className="flex items-center gap-2 rounded-xl bg-amber-500/90 px-4 py-2.5 text-sm font-semibold text-white shadow-lg backdrop-blur-sm">
        <WifiOff className="h-4 w-4" />
        You are offline — showing cached data
      </div>
    </div>
  )
}
