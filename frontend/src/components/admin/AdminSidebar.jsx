import { useMemo, useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, UserCog, User, LogOut, ChevronDown, Trophy, Megaphone, ClipboardList, UsersRound, BookOpen, Menu, X } from 'lucide-react'
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

function SidebarNavLink({ to, label, icon: Icon, badge, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
          isActive
            ? 'bg-white/20 text-white'
            : 'text-blue-100 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      <Icon size={18} />
      <span className="truncate">{label}</span>
      {badge ? (
        <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold leading-none text-white">
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
  const [drawerOpen, setDrawerOpen] = useState(false)

  const pendingBadge = badges?.pendingMembership
  const newLogsBadge = badges?.newLogs

  const userPosition = user?.position || 'NONE'

  const openLogoutConfirm = () => {
    setDrawerOpen(false)
    setUserMenuOpen(false)
    setConfirmLogoutOpen(true)
  }

  const closeDrawer = () => setDrawerOpen(false)

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

  const navItems = NAV_ITEMS.map((item) => ({
    ...item,
    badge: badgeCount(item.to),
  }))

  return (
    <>
      {/* Mobile / tablet top bar — hamburger on the left, everything else on the right */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-[#001F4D] text-white shadow-lg shadow-slate-950/20 lg:hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-blue-100 transition hover:bg-white/10 hover:text-white"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1" />

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
              <div className="absolute right-0 top-12 z-10 w-44 rounded-2xl border border-white/10 bg-[#001F4D] shadow-xl">
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

          {/* Theme toggle + sign out */}
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle className="border-white/20 bg-white/0 text-blue-100 hover:bg-white/10 hover:text-white dark:border-white/20 dark:bg-white/0 dark:text-blue-100" />
            <button
              type="button"
              onClick={openLogoutConfirm}
              title="Sign out"
              aria-label="Sign out"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-blue-100 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-64 flex-col border-r border-white/10 bg-[#001F4D] text-white shadow-xl shadow-slate-950/20 lg:flex">
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
          <img src="/icpep_logo.png" alt="ICpEP.SE" className="h-9 w-9 flex-shrink-0 rounded-full bg-white/10 object-contain" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">ICpEP.SE Portal</p>
            <p className="truncate text-[11px] font-semibold text-blue-100/70">Admin Panel</p>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <SidebarNavLink
              key={item.to}
              to={item.to}
              label={item.label}
              icon={item.icon}
              badge={item.badge}
              onClick={() => setUserMenuOpen(false)}
            />
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <NavLink
            to="/admin/profile"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-white/10 hover:text-white"
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
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold leading-tight">{userCard.username}</span>
              <span className="block truncate text-[11px] font-semibold text-blue-100/70">{userCard.userPosition}</span>
            </span>
          </NavLink>
          <div className="mt-2 flex items-center justify-between gap-2">
            <ThemeToggle className="bg-white/0 text-blue-100 hover:bg-white/10 hover:text-white" />
            <button
              type="button"
              onClick={openLogoutConfirm}
              className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-white/10"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile / tablet navigation drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col bg-[#001F4D] text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white">
                  <User size={15} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold leading-tight">{userCard.username}</p>
                  <p className="truncate text-[11px] font-semibold text-blue-100/70">{userCard.userPosition}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Close navigation menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-blue-100 transition hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeDrawer}
                  className={({ isActive }) =>
                    [
                      'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white',
                    ].join(' ')
                  }
                >
                  <item.icon size={18} />
                  <span className="truncate">{item.label}</span>
                  {item.badge ? (
                    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-bold leading-none text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </NavLink>
              ))}
            </nav>

            <div className="border-t border-white/10 p-3">
              <NavLink
                to="/admin/profile"
                onClick={closeDrawer}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-blue-100 transition hover:bg-white/10 hover:text-white"
              >
                <UserCog size={18} />
                Profile
              </NavLink>
              <div className="mt-2 flex items-center justify-between gap-2">
                <ThemeToggle className="bg-white/0 text-blue-100 hover:bg-white/10 hover:text-white" />
                <button
                  type="button"
                  onClick={openLogoutConfirm}
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-white/10"
                >
                  <LogOut size={16} />
                  Sign out
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

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