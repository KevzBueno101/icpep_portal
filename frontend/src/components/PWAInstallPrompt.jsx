import { useEffect, useState } from 'react'

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already dismissed or installed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissed) return

    // Detect iOS
    const ios = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
    
    if (isInStandaloneMode) return // Already installed, don't show

    if (ios) {
      setIsIOS(true)
      setTimeout(() => setShowModal(true), 3000)
      return
    }

    // Android / Desktop Chrome
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setTimeout(() => setShowModal(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-prompt-dismissed', 'true')
    }
    setDeferredPrompt(null)
    setShowModal(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', 'true')
    setShowModal(false)
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-[#001F4D] border border-white/20 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-white">
        
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/icpep_logo.png"
            alt="ICpEP Logo"
            className="w-20 h-20 rounded-full object-cover border-2 border-white/30"
          />
        </div>

        {/* Text */}
        <h2 className="text-lg font-bold text-center mb-1">
          ICpEP.SE CatSU Portal
        </h2>
        <p className="text-sm text-white/70 text-center mb-6">
          {isIOS
            ? 'Tap the Share button then select "Add to Home Screen" to install the app.'
            : 'Install the portal on your device for faster access, even when offline.'}
        </p>

        {/* Buttons */}
        {isIOS ? (
          <button
            onClick={handleDismiss}
            className="w-full py-2 rounded-lg border border-white/30 text-white/70 text-sm hover:bg-white/10 transition"
          >
            Sige, gets ko na
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={handleInstall}
              className="w-full py-2 rounded-lg bg-white text-[#001F4D] font-semibold text-sm hover:bg-white/90 transition"
            >
              I-install ang App
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-2 rounded-lg border border-white/30 text-white/70 text-sm hover:bg-white/10 transition"
            >
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  )
}