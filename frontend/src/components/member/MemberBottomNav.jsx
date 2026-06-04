import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const TAB_ITEMS = [
  { key: 'home', label: 'Home', icon: HomeIcon },
  { key: 'announcements', label: 'Announcements', icon: AnnouncementIcon },
  { key: 'profile', label: 'Profile', icon: ProfileIcon },
  { key: 'more', label: 'Settings', icon: SettingsIcon },
]

function cx(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function MemberBottomNav({
  activeTab,
  setActiveTab,
  announcementsBadge = 0,
  onLogout,
}) {
  const location = useLocation()
  const navigate = useNavigate()

  // If route changes, keep tab selection (no remount refetch requirement)
  // but ensure a sane default.
  const initialTab = useMemo(() => {
    if (activeTab) return activeTab
    return 'home'
  }, [])

  const [localActive, setLocalActive] = useState(initialTab)
  const resolvedActive = activeTab || localActive

  const tabBadge = resolvedActive === 'announcements' ? announcementsBadge : announcementsBadge

  return (
    <div
      className={cx(
        'md:hidden fixed inset-x-0 bottom-0 z-50 bg-white border-t border-slate-200',
        // safe-area padding for iPhone
        'pb-[env(safe-area-inset-bottom)]'
      )}
      role="navigation"
      aria-label="Member navigation"
    >
      <div className="flex items-stretch">
        {TAB_ITEMS.map((tab) => {
          const Icon = tab.icon
          const isActive = resolvedActive === tab.key

          const badge = tab.key === 'announcements' ? tabBadge : 0

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setLocalActive(tab.key)
                setActiveTab?.(tab.key)
                // No full-page tab navigation; remain within MemberDashboard
              }}
              className={cx(
                'flex-1 flex flex-col items-center justify-center py-3 gap-1',
                isActive ? 'text-sky-600' : 'text-slate-400'
              )}
            >
              <div className="relative">
                <Icon active={isActive} />
                {badge > 0 && tab.key === 'announcements' && (
                  <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-sky-600 text-white text-[10px] font-bold px-1">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={cx('text-[11px] font-semibold', isActive ? 'opacity-100' : 'opacity-90')}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function HomeIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5l9-7 9 7" />
      <path d="M9 22V12h6v10" />
    </svg>
  )
}

function AnnouncementIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11.5V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4.5" />
      <path d="M7 20h10" />
      <path d="M12 20v-8" />
    </svg>
  )
}

function ProfileIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4.5 14.5-4.5 16 0" />
    </svg>
  )
}

function SettingsIcon({ active }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-1.5 2.6-0.2-.1a2 2 0 0 0-2 .1 8.7 8.7 0 0 1-1 .6 2 2 0 0 0-1.2 1.7V24H10v-0.9a2 2 0 0 0-1.2-1.7 8.7 8.7 0 0 1-1-.6 2 2 0 0 0-2-.1l-.2.1-1.5-2.6.1-.1a1.8 1.8 0 0 0 .4-2 9.8 9.8 0 0 1 0-1 1.8 1.8 0 0 0-.4-2l-.1-.1 1.5-2.6.2.1a2 2 0 0 0 2-.1 8.7 8.7 0 0 1 1-.6A2 2 0 0 0 10 2.9V2h4v.9a2 2 0 0 0 1.2 1.7 8.7 8.7 0 0 1 1 .6 2 2 0 0 0 2 .1l.2-.1 1.5 2.6-.1.1a1.8 1.8 0 0 0-.4 2 9.8 9.8 0 0 1 0 1z" />
    </svg>
  )
}

