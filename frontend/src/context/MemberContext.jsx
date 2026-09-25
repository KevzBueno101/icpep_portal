import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'
import { EVENTS } from '../utils/events'

const MemberContext = createContext(null)

const getSeenKey = (userId) => `icpep_seen_announcements_${userId}`

const getLastSeenAt = (userId) => {
  try {
    const raw = localStorage.getItem(getSeenKey(userId))
    return raw ? Number(raw) || 0 : 0
  } catch {
    return 0
  }
}

export const MemberProvider = ({ children }) => {
  const { user, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileCacheKey, setProfileCacheKey] = useState(0)
  const [paymentSettings, setPaymentSettings] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [announcements, setAnnouncements] = useState([])
  const [annLoading, setAnnLoading] = useState(false)
  const [lastSeenAt, setLastSeenAt] = useState(() => getLastSeenAt(user?.id))
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(0)

  const markAnnouncementsSeen = useCallback(() => {
    if (!user?.id) return
    const now = Date.now()
    try {
      localStorage.setItem(getSeenKey(user.id), String(now))
    } catch {
      // localStorage unavailable — badge just stays visible
    }
    setLastSeenAt(now)
    setUnreadAnnouncements(0)
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    setLastSeenAt(getLastSeenAt(user.id))
  }, [user?.id])

  useEffect(() => {
    if (!announcements.length) {
      setUnreadAnnouncements(0)
      return
    }
    const unread = announcements.filter((a) => {
      const created = new Date(a.created_at || 0).getTime()
      return created > lastSeenAt
    }).length
    setUnreadAnnouncements(unread)
  }, [announcements, lastSeenAt])

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
      setProfileCacheKey((k) => k + 1)
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
      const res = await api.get('/announcements/?include_members_only=1')
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

  useEffect(() => {
    const onProfileUpdated = () => {
      fetchProfile()
      fetchPaymentSettings()
    }
    const onAnnouncementsUpdated = () => fetchAnnouncements()
    const onPaymentSettingsUpdated = () => fetchPaymentSettings()
    const onMemberListUpdated = () => fetchProfile()

    window.addEventListener(EVENTS.PROFILE_UPDATED, onProfileUpdated)
    window.addEventListener(EVENTS.ANNOUNCEMENTS_UPDATED, onAnnouncementsUpdated)
    window.addEventListener(EVENTS.PAYMENT_SETTINGS_UPDATED, onPaymentSettingsUpdated)
    window.addEventListener(EVENTS.MEMBER_LIST_UPDATED, onMemberListUpdated)
    window.addEventListener('announcementUpdated', onAnnouncementsUpdated)
    window.addEventListener('announcementDeleted', onAnnouncementsUpdated)

    return () => {
      window.removeEventListener(EVENTS.PROFILE_UPDATED, onProfileUpdated)
      window.removeEventListener(EVENTS.ANNOUNCEMENTS_UPDATED, onAnnouncementsUpdated)
      window.removeEventListener(EVENTS.PAYMENT_SETTINGS_UPDATED, onPaymentSettingsUpdated)
      window.removeEventListener(EVENTS.MEMBER_LIST_UPDATED, onMemberListUpdated)
      window.removeEventListener('announcementUpdated', onAnnouncementsUpdated)
      window.removeEventListener('announcementDeleted', onAnnouncementsUpdated)
    }
  }, [fetchProfile, fetchPaymentSettings, fetchAnnouncements])

  useEffect(() => {
    const onFocus = () => {
      document.visibilityState === 'visible' && fetchProfile()
    }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [fetchProfile])

  const value = {
    profile,
    profileCacheKey,
    profileLoading,
    paymentSettings,
    paymentLoading,
    announcements,
    annLoading,
    unreadAnnouncements,
    markAnnouncementsSeen,
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
