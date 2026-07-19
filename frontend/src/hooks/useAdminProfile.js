import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

export default function useAdminProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cacheKey, setCacheKey] = useState(0)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/users/admin/profile/')
      setProfile(res.data)
      setCacheKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError(err?.response?.data?.detail || 'Failed to load profile.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    const handler = () => fetchProfile()
    window.addEventListener('profile-updated', handler)
    return () => window.removeEventListener('profile-updated', handler)
  }, [fetchProfile])

  // Use _cb=timestamp for browser cache-busting
  const profilePictureUrl = profile?.profile_picture
    ? (() => {
        const url = profile.profile_picture
        const separator = url.includes('?') ? '&' : '?'
        return `${url}${separator}_cb=${cacheKey}`
      })()
    : null

  const refetch = fetchProfile

  return { profile, loading, error, refetch, profilePictureUrl }
}