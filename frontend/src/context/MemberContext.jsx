import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'

const MemberContext = createContext(null)

export const MemberProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [paymentSettings, setPaymentSettings] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [annLoading, setAnnLoading] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return
    setProfileLoading(true)
    try {
      const res = await api.get('/members/')
      const items = Array.isArray(res.data) ? res.data : res.data?.results || []
      const meId = user.id
      const found = items.find((p) => {
        const pUser = p?.user
        return pUser === meId || String(pUser) === String(meId)
      })
      setProfile(found || null)
    } catch (err) {
      console.error(err)
      toast.error('Unable to fetch member profile.')
      setProfile(null)
    } finally {
      setProfileLoading(false)
    }
  }, [user?.id])

  const fetchPaymentSettings = useCallback(async () => {
    if (!user?.id) return
    setPaymentLoading(true)
    try {
      const res = await api.get('/members/payment-settings/')
      setPaymentSettings(res.data || null)
    } catch (err) {
      console.error(err)
      setPaymentSettings(null)
    } finally {
      setPaymentLoading(false)
    }
  }, [user?.id])

  const fetchAnnouncements = useCallback(async () => {
    if (!user?.id) return
    setAnnLoading(true)
    try {
      const res = await api.get('/announcements/')
      setAnnouncements(res.data?.results || [])
    } catch (err) {
      console.error(err)
      setAnnouncements([])
    } finally {
      setAnnLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setProfile(null)
      setPaymentSettings(null)
      setAnnouncements([])
      setProfileLoading(false)
      return
    }

    fetchProfile()
    fetchPaymentSettings()
    fetchAnnouncements()
  }, [user, authLoading, fetchProfile, fetchPaymentSettings, fetchAnnouncements])

  const value = {
    profile,
    profileLoading,
    paymentSettings,
    paymentLoading,
    announcements,
    annLoading,
    refreshProfile: fetchProfile,
    refreshPaymentSettings: fetchPaymentSettings,
    refreshAnnouncements: fetchAnnouncements,
  }

  return <MemberContext.Provider value={value}>{children}</MemberContext.Provider>
}

export const useMember = () => {
  const context = useContext(MemberContext)
  if (!context) {
    throw new Error('useMember must be used within a MemberProvider')
  }
  return context
}
