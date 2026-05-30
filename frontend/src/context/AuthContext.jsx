import { useContext, useState, useEffect } from 'react'
import AuthContext from './authState'
import api, { publicApi } from '../api/axios'

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/auth/me/')
        .then((res) => setUser(res.data))
        .catch((err) => {
          // Handle 401 gracefully - token might be expired
          if (err.response?.status === 401) {
            localStorage.clear()
            setUser(null)
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  /** Regular member login */
  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access_token',  res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    const me = await api.get('/auth/me/')
    setUser(me.data)
    return me.data
  }

  const refreshUser = async () => {
    const me = await api.get('/auth/me/')
    setUser(me.data)
    return me.data
  }

  /** Admin-only login — hits the restricted endpoint */
  const adminLogin = async (email, password) => {
    const res = await api.post('/auth/admin-login/', { email, password })
    localStorage.setItem('access_token',  res.data.tokens.access)
    localStorage.setItem('refresh_token', res.data.tokens.refresh)
    setUser(res.data.user)
    return res.data.user
  }

  const register = async (formData) => {
    const res = await publicApi.post('/auth/register/', formData)
    localStorage.setItem('access_token',  res.data.tokens.access)
    localStorage.setItem('refresh_token', res.data.tokens.refresh)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, register, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
