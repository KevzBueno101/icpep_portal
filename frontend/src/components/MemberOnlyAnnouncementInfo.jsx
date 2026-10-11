import { useState, useEffect } from 'react'
import { useAuth } from '../context/useAuth'
import { Lock, X, ArrowRight } from 'lucide-react'
import api from '../api/axios'

const DISMISSAL_KEY = 'icpep_members_only_info_dismissed'

export default function MemberOnlyAnnouncementInfo() {
  const { user } = useAuth()
  const [isVisible, setIsVisible] = useState(false)
  const [membersOnlyCount, setMembersOnlyCount] = useState(0)

  useEffect(() => {
    // Check if user is authenticated
    if (user) {
      setIsVisible(false)
      return
    }

    // Check if previously dismissed
    const wasDismissed = localStorage.getItem(DISMISSAL_KEY)
    if (wasDismissed) {
      setIsVisible(false)
      return
    }

    // Fetch members-only announcements count
    const fetchMembersOnlyCount = async () => {
      try {
        const res = await api.get('/announcements/')
        const announcements = res.data?.results || []
        const count = announcements.filter((a) => a.members_only).length
        setMembersOnlyCount(count)
        if (count > 0) {
          setIsVisible(true)
        }
      } catch {
        // Silently fail - info box is optional
      }
    }

    fetchMembersOnlyCount()
  }, [user])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem(DISMISSAL_KEY, 'true')
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-16 left-0 right-0 z-[9998] bg-violet-500/30 text-white text-center py-3 px-4 shadow-lg backdrop-blur-sm relative">
      <div className="flex items-center justify-center gap-3">
        <Lock className="h-5 w-5" />
        <span className="text-sm font-medium">
          {membersOnlyCount} {membersOnlyCount === 1 ? 'announcement' : 'announcements'} available for members only
        </span>
        <a
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/20 hover:bg-white/30 px-4 py-1.5 text-xs font-semibold transition backdrop-blur-sm"
        >
          Login to view
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
        aria-label="Close info"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
