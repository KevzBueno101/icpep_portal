const TAP_WINDOW = 2500
const TAP_COUNT = 5
const TAPS_KEY = 'icpep-logo-taps'

/**
 * Records a logo tap and returns true when the secret 5-tap threshold
 * is reached. Uses sessionStorage so the count survives page remounts
 * between taps.
 */
export function registerLogoTap() {
  const now = Date.now()
  let recentTaps = []

  try {
    const stored = sessionStorage.getItem(TAPS_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    if (Array.isArray(parsed)) recentTaps = parsed
  } catch {
    recentTaps = []
  }

  recentTaps = recentTaps.filter((t) => now - t < TAP_WINDOW)
  recentTaps.push(now)

  if (recentTaps.length >= TAP_COUNT) {
    sessionStorage.removeItem(TAPS_KEY)
    return true
  }

  sessionStorage.setItem(TAPS_KEY, JSON.stringify(recentTaps))
  return false
}
