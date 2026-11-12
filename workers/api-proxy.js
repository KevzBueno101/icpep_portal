const BACKENDS = {
  'icpep-api.icpep-se-catsuchapter.workers.dev': 'https://icpep-backend-mriy.onrender.com',
  'icpep-api-main.icpep-se-catsuchapter.workers.dev': 'https://icpep-portal-backend.onrender.com',
}
const DEFAULT_BACKEND = 'https://icpep-backend-mriy.onrender.com'

// Keep in sync with backend/config/settings.py (CORS_ALLOWED_ORIGINS).
const ALLOWED_ORIGINS = new Set([
  'https://icpepcatsu.app',
  'https://icpep-catsu.vercel.app',
  'https://icpep-portal-test.vercel.app',
])

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
  /^https:\/\/[a-z0-9-]+\.onrender\.com$/,
  /^https:\/\/icpep-frontend-vercel\.app$/,
]

const ALLOWED_METHODS = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
const ALLOWED_HEADERS =
  'accept, accept-encoding, authorization, content-type, dnt, origin, ' +
  'user-agent, x-csrftoken, x-requested-with'
const PREFLIGHT_MAX_AGE = '86400'

function isAllowedOrigin(origin) {
  if (!origin) return false
  return (
    ALLOWED_ORIGINS.has(origin) ||
    ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))
  )
}

// Ensures every response to an allowed browser origin carries CORS headers.
// Django normally adds these, but when the upstream is asleep/restarting we
// return our own error response, and the browser must still be able to read
// the real status instead of reporting a misleading CORS failure.
function withCors(response, origin) {
  if (!isAllowedOrigin(origin)) return response

  const headers = new Headers(response.headers)
  headers.set('Access-Control-Allow-Origin', origin)

  const vary = headers.get('Vary')
  if (!vary) {
    headers.set('Vary', 'Origin')
  } else if (!/\borigin\b/i.test(vary)) {
    headers.set('Vary', `${vary}, Origin`)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

function preflightResponse(request, origin) {
  const headers = new Headers()
  headers.set(
    'Vary',
    'Origin, Access-Control-Request-Method, Access-Control-Request-Headers'
  )

  if (isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS)
    headers.set(
      'Access-Control-Allow-Headers',
      request.headers.get('Access-Control-Request-Headers') || ALLOWED_HEADERS
    )
    headers.set('Access-Control-Max-Age', PREFLIGHT_MAX_AGE)
  }

  return new Response(null, { status: 204, headers })
}

export default {
  async fetch(request) {
    const origin = request.headers.get('Origin')
    const host = request.headers.get('host') || ''

    // Answer preflights at the edge so login/landing never fail just because
    // the Render backend is cold-starting.
    if (request.method === 'OPTIONS') {
      return preflightResponse(request, origin)
    }

    const backend = BACKENDS[host] || DEFAULT_BACKEND
    const url = new URL(request.url)
    const target = backend + url.pathname + url.search

    const headers = new Headers(request.headers)
    headers.set('Host', new URL(backend).host)
    headers.set('X-Forwarded-Proto', 'https')
    headers.set('X-Forwarded-Host', host)
    const cfIp = request.headers.get('CF-Connecting-IP')
    if (cfIp) headers.set('X-Forwarded-For', cfIp)

    const init = {
      method: request.method,
      headers,
      redirect: 'manual',
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = request.body
    }

    let resp
    try {
      resp = await fetch(target, init)
    } catch (error) {
      // Upstream unreachable (Render asleep, DNS failure, network error).
      // Return a real, readable 502 instead of an opaque CORS failure.
      const body = JSON.stringify({
        detail: 'API temporarily unavailable. Please try again in a moment.',
        error: String(error?.message || error),
      })
      return withCors(
        new Response(body, {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        }),
        origin
      )
    }

    return withCors(new Response(resp.body, resp), origin)
  },
}