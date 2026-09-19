import { clientsClaim } from 'workbox-core'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'

// Take control of currently-open tabs as soon as the fresh service worker activates
clientsClaim()

// Gain control via the "Refresh now" button in the UpdateNotice banner
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Precache all build assets (manifest is injected at build time)
precacheAndRoute(self.__WB_MANIFEST)

// SPA navigation fallback (exclude API calls). If the cached app shell
// (index.html) is unavailable — e.g. cache eviction or a stale install —
// fall back to fetching it from the network instead of showing a blank page.
const navigationRoute = new NavigationRoute(
  async ({ event }) => {
    const cached = await caches.match('/index.html')
    if (cached) return cached
    return fetch(event.request)
  },
  {
    denylist: [/\/api\//],
  }
)
registerRoute(navigationRoute)

// Hashed build assets (JS/CSS). Guard against the SPA HTML fallback (Vercel
// serves index.html for any 404) masquerading as JavaScript/CSS, which throws
// a MIME-type error and blanks out the whole app.
registerRoute(
  ({ url }) => url.pathname.startsWith('/assets/'),
  async ({ request }) => {
    try {
      const response = await fetch(request)
      if (response.ok) {
        const type = response.headers.get('content-type') || ''
        if (!type.includes('text/html')) {
          const cache = await caches.open('asset-cache')
          cache.put(request, response.clone())
        }
        return response
      }
    } catch {
      // Offline — fall through to the cache below.
    }
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      const type = cachedResponse.headers.get('content-type') || ''
      if (!type.includes('text/html')) return cachedResponse
    }
    return new Response('Not found', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
)

// API requests — prefer cache, refresh in the background.
// Exclude /api/push/ so the VAPID key and subscription endpoints are never
// served stale (a cached wrong key causes pushManager.subscribe to fail).
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/push/'),
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 7,
      }),
    ],
  })
)

// Images — cache first
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }),
    ],
  })
)

// Google Fonts — cache first
registerRoute(
  /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
  new CacheFirst({
    cacheName: 'font-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 60,
      }),
    ],
  })
)

// ── Web Push ──────────────────────────────────────────────────────────────────

const NOTIFICATION_DEFAULTS = {
  title: 'New announcement',
  body: '',
  icon: '/pwa-192x192.png',
  badge: '/pwa-192x192.png',
  url: '/',
}

self.addEventListener('push', (event) => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    // Non-JSON payload — fall back to defaults
  }

  const notification = { ...NOTIFICATION_DEFAULTS, ...payload }

  event.waitUntil(
    self.registration
      .showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        badge: notification.badge,
        data: { url: notification.url },
      })
      .catch(() => {})
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      })

      for (const client of windowClients) {
        try {
          await client.navigate(url)
          return client.focus()
        } catch {
          // Fall through to opening a new window
        }
      }

      return self.clients.openWindow(url)
    })()
  )
})
