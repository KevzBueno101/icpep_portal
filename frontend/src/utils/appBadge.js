const BADGE_MESSAGE_SET = 'SET_UNREAD_BADGE'
const BADGE_MESSAGE_CLEAR = 'CLEAR_UNREAD_BADGE'

function isInstalledStandalone() {
  return (
    typeof window !== 'undefined' &&
    (window.navigator?.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches))
  )
}

function isMobile() {
  return typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent || '')
}

async function postBadgeMessage(type) {
  try {
    if (!('serviceWorker' in navigator)) return
    const registration = await navigator.serviceWorker.getRegistration()
    const worker = registration?.active || registration?.waiting
    worker?.postMessage({ type })
  } catch {
    // Badge updates are best-effort; never throw into app code.
  }
}

export async function setUnreadBadge() {
  if (!isInstalledStandalone()) return
  // iOS/iPadOS 16.4+ and desktop Chrome/Edge render this directly on the icon.
  if ('setAppBadge' in navigator) {
    try {
      await navigator.setAppBadge()
    } catch {
      // Permission missing on this platform — fall through to the SW nudge.
    }
  }
  // On mobile the service worker keeps a silent, tagged notification so the
  // indicator persists (Android launcher dot). iOS also gets setAppBadge above.
  if (isMobile()) {
    await postBadgeMessage(BADGE_MESSAGE_SET)
  }
}

export async function clearUnreadBadge() {
  if (!isInstalledStandalone()) return
  if ('clearAppBadge' in navigator) {
    try {
      await navigator.clearAppBadge()
    } catch {
      // ignore
    }
  }
  if (isMobile()) {
    await postBadgeMessage(BADGE_MESSAGE_CLEAR)
  }
}