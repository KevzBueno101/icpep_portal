export function getMemberUpdatesWsUrl() {
  const explicit = import.meta.env.VITE_WS_URL
  if (explicit) {
    return `${explicit.replace(/\/$/, '')}/ws/member_updates/`
  }

  // No explicit WS host: derive it from the API origin so the socket follows
  // the same Worker/proxy path as HTTP traffic. This avoids sending WS
  // connections straight to *.onrender.com, which some ISPs block.
  const apiBase = import.meta.env.VITE_API_URL
  if (apiBase) {
    try {
      const url = new URL(apiBase)
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
      const basePath = url.pathname.replace(/\/+$/, '').replace(/\/api$/, '')
      return `${wsProtocol}//${url.host}${basePath}/ws/member_updates/`
    } catch {
      // Invalid API URL — fall through to same-origin.
    }
  }

  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/ws/member_updates/`
}