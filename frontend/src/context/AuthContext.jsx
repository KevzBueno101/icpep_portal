import { useContext, useState, useEffect } from 'react'
import AuthContext from './authState'
import api, { publicApi } from '../api/axios'
import {
  MEMBER_ACCESS_KEY,
  MEMBER_REFRESH_KEY,
  ADMIN_ACCESS_KEY,
  ADMIN_REFRESH_KEY,
} from '../api/axios'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // One-time migration: clear old single-key tokens from previous implementation
    // to prevent stale admin/member token collisions.
    const legacyAccess = localStorage.getItem('access_token')
    const legacyRefresh = localStorage.getItem('refresh_token')
    if (legacyAccess || legacyRefresh) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setLoading(false)
      return
    }

    const memberToken = localStorage.getItem(MEMBER_ACCESS_KEY)
    const adminToken = localStorage.getItem(ADMIN_ACCESS_KEY)
    // If both tokens exist, prefer the one matching the current route.
    // This prevents a logged-in admin from being overwritten by a stale member token.
    const isAdminRoute = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/admin-portal')

    const token = isAdminRoute ? (adminToken || memberToken) : (memberToken || adminToken)

    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      api
        .get('/auth/me/')
        .then((res) => setUser(res.data))
        .catch((err) => {
          if (err.response?.status === 401) {
            if (memberToken && !isAdminRoute) {
              localStorage.removeItem(MEMBER_ACCESS_KEY)
              localStorage.removeItem(MEMBER_REFRESH_KEY)
            } else if (adminToken && isAdminRoute) {
              localStorage.removeItem(ADMIN_ACCESS_KEY)
              localStorage.removeItem(ADMIN_REFRESH_KEY)
            } else if (memberToken && isAdminRoute) {
              // admin route but we used member token
              localStorage.removeItem(MEMBER_ACCESS_KEY)
              localStorage.removeItem(MEMBER_REFRESH_KEY)
            } else {
              localStorage.removeItem(ADMIN_ACCESS_KEY)
              localStorage.removeItem(ADMIN_REFRESH_KEY)
            }
            setUser(null)
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    // Clear any existing admin tokens first to avoid collision
    localStorage.removeItem(ADMIN_ACCESS_KEY)
    localStorage.removeItem(ADMIN_REFRESH_KEY)

    const res = await api.post('/auth/login/', { email, password })
    localStorage.setItem(MEMBER_ACCESS_KEY, res.data.access)
    localStorage.setItem(MEMBER_REFRESH_KEY, res.data.refresh)

    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access}`

    const me = await api.get('/auth/me/')
    setUser(me.data)
    return me.data
  }

  const refreshUser = async () => {
    const me = await api.get('/auth/me/')
    setUser(me.data)
    return me.data
  }

  const adminLogin = async (email, password) => {
    // Clear any existing member tokens first to avoid collision
    localStorage.removeItem(MEMBER_ACCESS_KEY)
    localStorage.removeItem(MEMBER_REFRESH_KEY)

    const res = await api.post('/auth/admin-login/', { email, password })
    localStorage.setItem(ADMIN_ACCESS_KEY, res.data.tokens.access)
    localStorage.setItem(ADMIN_REFRESH_KEY, res.data.tokens.refresh)

    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.tokens.access}`

    setUser(res.data.user)
    return res.data.user
  }

  const register = async (formData) => {
    // Clear any existing admin tokens first
    localStorage.removeItem(ADMIN_ACCESS_KEY)
    localStorage.removeItem(ADMIN_REFRESH_KEY)

    const res = await publicApi.post('/auth/register/', formData)
    localStorage.setItem(MEMBER_ACCESS_KEY, res.data.tokens.access)
    localStorage.setItem(MEMBER_REFRESH_KEY, res.data.tokens.refresh)

    api.defaults.headers.common['Authorization'] = `Bearer ${res.data.tokens.access}`

    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.removeItem(MEMBER_ACCESS_KEY)
    localStorage.removeItem(MEMBER_REFRESH_KEY)
    localStorage.removeItem(ADMIN_ACCESS_KEY)
    localStorage.removeItem(ADMIN_REFRESH_KEY)

    // clear legacy keys
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')

    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, adminLogin, register, refreshUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

