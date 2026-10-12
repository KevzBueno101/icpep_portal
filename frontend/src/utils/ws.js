export function getMemberUpdatesWsUrl() {
  const base = import.meta.env.VITE_WS_URL
  if (base) {
    return `${base.replace(/\/$/, '')}/ws/member_updates/`
  }
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/ws/member_updates/`
}
