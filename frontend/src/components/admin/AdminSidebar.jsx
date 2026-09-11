import { useMemo, useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, UserCog, User, LogOut, ChevronDown, Trophy, Megaphone, ClipboardList, UsersRound, BookOpen } from 'lucide-react'
import ConfirmModal from '../common/ConfirmModal'
import ThemeToggle from '../ThemeToggle'
import { useAuth } from '../../context/useAuth'
import { resolveProfilePictureUrl } from '../../utils/profilePicture'

const NAV_ITEMS = [
  { label: 'Dashboard',         to: '/admin/dashboard',         icon: LayoutDashboard },
  { label: 'Announcement',      to: '/admin/announcement',       icon: Megaphone },
  { label: 'About Orgs',        to: '/admin/about',              icon: BookOpen },
  { label: 'Members',           to: '/admin/membership',         icon: Users },
  { label: 'Admins',            to: '/admin/admins',             icon: UserCog },
  { label: 'Officers Roster',   to: '/admin/officers-accounts',  icon: UsersRound },
  { label: 'Achievements',      to: '/admin/achievements',       icon: Trophy },
  { label: 'Profile',           to: '/admin/profile',            icon: User },
  { label: 'Logs / Audit Trails', to: '/admin/logs',            icon: ClipboardList },
]

function TopNavLink({ to, label, icon: Icon, badge, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        [
          'relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition',
          isActive
            ? 'bg-white/20 text-white'
            : 'text-blue-100 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      <Icon size={18} />
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </NavLink>
  )
}

export default function AdminSidebar({ badges = {}, logout }) {
  const { user } = useAuth()

  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const pendingBadge = badges?.pendingMembership
  const newLogsBadge = badges?.newLogs

  const userPosition = user?.position || 'NONE'

  const prevPicRef = useRef(user?.profile_picture)
  const [picVersion, setPicVersion] = useState(0)
  useEffect(() => {
    if (user?.profile_picture && user.profile_picture !== prevPicRef.current) {
      setPicVersion(v => v + 1)
      prevPicRef.current = user.profile_picture
    }
  }, [user?.profile_picture])

  const profilePicSrc = useMemo(() => {
    if (!user?.profile_picture) return null
    const base = resolveProfilePictureUrl(user.profile_picture)
    const sep = base.includes('?') ? '&' : '?'
    return `${base}${sep}_cb=${picVersion}`
  }, [user?.profile_picture, picVersion])

  const userCard = useMemo(() => {
    const username = user?.username ? `@${user.username}` : '@admin'
    return { username, userPosition }
  }, [user?.username, userPosition])

  const badgeCount = (to) => {
    if (to === '/admin/membership') {
      return typeof pendingBadge === 'number' && pendingBadge > 0
        ? (pendingBadge > 99 ? '99+' : pendingBadge)
        : null
    }
    if (to === '/admin/logs') {
      return typeof newLogsBadge === 'number' && newLogsBadge > 0
        ? (newLogsBadge > 99 ? '99+' : newLogsBadge)
        : null
    }
    return null
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#001F4D] text-white shadow-lg shadow-slate-950/20">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 py-2 sm:px-4">
          {/* User */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setUserMenuOpen(s => !s)}
              className="inline-flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition hover:bg-white/10"
              aria-label="Open admin user menu"
            >
              {user?.profile_picture ? (
                <img
                  src={profilePicSrc}
                  alt={user.username}
                  className="h-8 w-8 flex-shrink-0 rounded-full border-2 border-white/20 object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-sky-500 to-sky-600 text-white">
                  <User size={15} />
                </span>
              )}
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-xs font-bold leading-tight">
                  {userCard.username}
                </span>
                <span className="block text-[10px] font-semibold text-blue-100/70">
                  {userCard.userPosition}
                </span>
              </span>
              <ChevronDown size={14} className="text-blue-100" />
            </button>

            {userMenuOpen && (
              <div className="absolute left-0 top-12 z-10 w-44 rounded-2xl border border-white/10 bg-[#001F4D] shadow-xl">
                <NavLink
                  to="/admin/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-4 py-3 text-sm text-blue-100 hover:bg-white/10"
                >
                  View Profile
                </NavLink>
                <NavLink
                  to="/admin/edit-profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="block px-4 py-3 text-sm text-blue-100 hover:bg-white/10"
                >
                  Edit Profile
                </NavLink>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false)
                    setConfirmLogoutOpen(true)
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-red-200 hover:bg-white/10"
                >
                  <span className="inline-flex items-center gap-2">
                    <LogOut size={16} /> Logout
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Nav icons — horizontally scrollable */}
          <nav className="custom-scrollbar flex flex-1 items-center gap-1 overflow-x-auto px-1">
            {NAV_ITEMS.map((item) => (
              <TopNavLink
                key={item.to}
                to={item.to}
                label={item.label}
                icon={item.icon}
                badge={badgeCount(item.to)}
                onNavigate={() => setUserMenuOpen(false)}
              />
            ))}
          </nav>

          {/* Theme toggle + sign out */}
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle className="border-white/20 bg-white/0 text-blue-100 hover:bg-white/10 hover:text-white dark:border-white/20 dark:bg-white/0 dark:text-blue-100" />
            <button
              type="button"
              onClick={() => setConfirmLogoutOpen(true)}
              title="Sign out"
              aria-label="Sign out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-blue-100 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <ConfirmModal
        isOpen={confirmLogoutOpen}
        variant="caution"
        title="Sign out?"
        description="You will be logged out immediately."
        confirmText="Sign out"
        cancelText="Cancel"
        busy={false}
        onConfirm={() => {
          setConfirmLogoutOpen(false)
          if (typeof logout === 'function') logout()
        }}
        onCancel={() => setConfirmLogoutOpen(false)}
      />
    </>
  )
}
