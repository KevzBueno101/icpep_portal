import { useEffect, useState } from 'react'
import api from '../api/axios'
import AuthContext from './authState'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('access_token')))

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      return
    }

    api.get('/auth/me/')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.clear()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', { email, password })
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    const me = await api.get('/auth/me/')
    setUser(me.data)
    return me.data
  }

  const register = async (formData) => {
    const res = await api.post('/auth/register/', formData)
    localStorage.setItem('access_token', res.data.tokens.access)
    localStorage.setItem('refresh_token', res.data.tokens.refresh)
    setUser(res.data.user)
    return res.data.user
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
