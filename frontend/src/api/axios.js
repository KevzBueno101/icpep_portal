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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/auth/me/')
    ) {
      original._retry = true
      const refresh = getRefreshToken()

      if (refresh) {
        try {
          const res = await axios.post(
            `${API_BASE}/auth/refresh/`,
            { refresh }
          )

          // Write new access token back to the same session type that triggered this request.
          // This avoids cases where an admin refresh key exists (or is stale) but the current request is a member request.
          const currentAuthHeader = original.headers?.Authorization
          const memberAccess = localStorage.getItem(MEMBER_ACCESS_KEY)

          const isMemberRequest =
            currentAuthHeader?.includes(memberAccess) ||
            (memberAccess && currentAuthHeader?.includes(`Bearer ${memberAccess}`))

          if (isMemberRequest) {
            localStorage.setItem(MEMBER_ACCESS_KEY, res.data.access)
          } else {
            localStorage.setItem(ADMIN_ACCESS_KEY, res.data.access)
          }


          original.headers.Authorization = `Bearer ${res.data.access}`
          return api(original)
        } catch {
          localStorage.removeItem(MEMBER_ACCESS_KEY)
          localStorage.removeItem(MEMBER_REFRESH_KEY)
          localStorage.removeItem(ADMIN_ACCESS_KEY)
          localStorage.removeItem(ADMIN_REFRESH_KEY)

          const isAdminPath = window.location.pathname.startsWith('/admin')
          window.location.href = isAdminPath
            ? '/admin-portal/login'
            : '/login'
        }
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

