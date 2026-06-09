import { useState, useEffect, useCallback } from 'react'
import api from '../api/axios'

export default function useAdminProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/users/admin/profile/')
      setProfile(res.data)
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

  const profilePictureUrl = profile?.profile_picture
    ? `${profile.profile_picture}${profile.profile_picture.includes('?') ? '&' : '?'}v=${Date.now()}`
    : null

  const refetch = fetchProfile

  return { profile, loading, error, refetch, profilePictureUrl }
}

