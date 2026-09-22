const ORIGIN = 'https://icpep-backend-mriy.onrender.com'

export default {
  async fetch(request) {
    const url = new URL(request.url)
    const target = ORIGIN + url.pathname + url.search

    const headers = new Headers(request.headers)
    headers.set('Host', new URL(ORIGIN).host)
    headers.set('X-Forwarded-Proto', 'https')
    headers.set('X-Forwarded-Host', request.headers.get('host') || '')
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

    const resp = await fetch(target, init)
    return new Response(resp.body, resp)
  },
}