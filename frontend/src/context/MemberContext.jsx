import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axios'
import { useAuth } from './useAuth'
import toast from 'react-hot-toast'
import { EVENTS } from '../utils/events'
import { setUnreadBadge, clearUnreadBadge } from '../utils/appBadge'

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

const getAboutSeenKey = (userId) => `icpep_seen_about_${userId}`

const getAboutLastSeenAt = (userId) => {
  try {
    const raw = localStorage.getItem(getAboutSeenKey(userId))
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
  const [aboutSections, setAboutSections] = useState([])
  const [aboutLastSeenAt, setAboutLastSeenAt] = useState(() => getAboutLastSeenAt(user?.id))
  const [aboutUnread, setAboutUnread] = useState({ constitution: 0, resolution: 0 })

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
    clearUnreadBadge()
  }, [user?.id])

  const markAboutSeen = useCallback(() => {
    if (!user?.id) return
    const now = Date.now()
    try {
      localStorage.setItem(getAboutSeenKey(user.id), String(now))
    } catch {
      // localStorage unavailable — badge just stays visible
    }
    setAboutLastSeenAt(now)
    setAboutUnread({ constitution: 0, resolution: 0 })
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

  // Mirror the unread-announcement state onto the installed app's icon
  // (iOS Badging API / Android persistent tray dot).
  useEffect(() => {
    if (!user?.id || !unreadAnnouncements) {
      clearUnreadBadge()
      return
    }
    setUnreadBadge()
  }, [user?.id, unreadAnnouncements])

  useEffect(() => {
    if (!aboutSections.length) {
      setAboutUnread({ constitution: 0, resolution: 0 })
      return
    }
    setAboutUnread({
      constitution: aboutSections.filter(
        (s) => s.section_type === 'CONSTITUTION' && new Date(s.updated_at || s.created_at || 0).getTime() > aboutLastSeenAt
      ).length,
      resolution: aboutSections.filter(
        (s) => s.section_type === 'RESOLUTION' && new Date(s.updated_at || s.created_at || 0).getTime() > aboutLastSeenAt
      ).length,
    })
  }, [aboutSections, aboutLastSeenAt])

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

  const fetchAnnouncements = useCallback(async (silent = false) => {
    if (!user?.id) return
    if (!silent) setAnnLoading(true)
    try {
      const res = await api.get('/announcements/?include_members_only=1')
      setAnnouncements(res.data?.results || [])
    } catch (err) {
      console.error(err)
      setAnnouncements([])
    } finally {
      if (!silent) setAnnLoading(false)
    }
  }, [user?.id])

  const fetchAboutSections = useCallback(async () => {
    if (!user?.id) return
    try {
      const res = await api.get('/about/')
      setAboutSections(res.data?.results || [])
    } catch (err) {
      console.error(err)
      setAboutSections([])
    }
  }, [user?.id])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setProfile(null)
      setPaymentSettings(null)
      setAnnouncements([])
      setAboutSections([])
      setProfileLoading(false)
      return
    }

    fetchProfile()
    fetchPaymentSettings()
    fetchAnnouncements()
    fetchAboutSections()
  }, [user, authLoading, fetchProfile, fetchPaymentSettings, fetchAnnouncements, fetchAboutSections])

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
      if (document.visibilityState !== 'visible') return
      fetchProfile()
      // Silent refresh: picks up pushes that arrived while the app was
      // suspended and re-syncs the app-icon badge accordingly.
      fetchAnnouncements(true)
    }
    document.addEventListener('visibilitychange', onFocus)
    return () => document.removeEventListener('visibilitychange', onFocus)
  }, [fetchProfile, fetchAnnouncements])

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
    aboutUnread,
    markAboutSeen,
    refreshProfile: fetchProfile,
    refreshPaymentSettings: fetchPaymentSettings,
    refreshAnnouncements: fetchAnnouncements,
    refreshAboutSections: fetchAboutSections,
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
