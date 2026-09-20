import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

// ─── Token key constants ──────────────────────────────────────────────────────
// Use separate keys so admin and member sessions never overwrite each other.
export const MEMBER_ACCESS_KEY = 'member_access_token'
export const MEMBER_REFRESH_KEY = 'member_refresh_token'
export const ADMIN_ACCESS_KEY = 'admin_access_token'
export const ADMIN_REFRESH_KEY = 'admin_refresh_token'

export const getAccessToken = () =>
  localStorage.getItem(ADMIN_ACCESS_KEY) ||
  localStorage.getItem(MEMBER_ACCESS_KEY) ||
  null

export const getRefreshToken = () =>
  localStorage.getItem(ADMIN_REFRESH_KEY) ||
  localStorage.getItem(MEMBER_REFRESH_KEY) ||
  null

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Shared in-flight refresh so concurrent 401s (e.g. dashboard parallel fetches)
// reuse ONE refresh call instead of each posting the same refresh token — the
// first rotation succeeds, the duplicate calls would get a blacklisted token
// and force an unwanted logout.
let refreshPromise = null

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = getRefreshToken()
      if (!refresh) throw new Error('No refresh token available')

      const res = await axios.post(`${API_BASE}/auth/refresh/`, { refresh })

      // SimpleJWT rotates the refresh token on every call, so persist the NEW
      // pair. Which bucket (admin vs member) owns it is decided by the refresh
      // token we actually used, so stale keys from the other session are never
      // overwritten.
      const isAdminBucket = refresh === localStorage.getItem(ADMIN_REFRESH_KEY)

      if (isAdminBucket) {
        localStorage.setItem(ADMIN_ACCESS_KEY, res.data.access)
        localStorage.setItem(ADMIN_REFRESH_KEY, res.data.refresh)
      } else {
        localStorage.setItem(MEMBER_ACCESS_KEY, res.data.access)
        localStorage.setItem(MEMBER_REFRESH_KEY, res.data.refresh)
      }

      return res.data
    })()
    refreshPromise.finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    const status = error.response?.status

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/auth/me/')
    ) {
      original._retry = true
      const refresh = getRefreshToken()

      if (refresh) {
        try {
          const res = await refreshSession()

          original.headers.Authorization = `Bearer ${res.access}`
          return api(original)
        } catch {
          // Refresh failed; fall through and clear the stale session below.
        }
      }

      localStorage.removeItem(MEMBER_ACCESS_KEY)
      localStorage.removeItem(MEMBER_REFRESH_KEY)
      localStorage.removeItem(ADMIN_ACCESS_KEY)
      localStorage.removeItem(ADMIN_REFRESH_KEY)

      if (!window.location.pathname.includes('/login')) {
        const isAdminPath = window.location.pathname.startsWith('/admin')
        window.location.href = isAdminPath
          ? '/admin-portal/login'
          : '/login'
      }
    }

    return Promise.reject(error)
  }
)

export const publicApi = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
})

export default api

