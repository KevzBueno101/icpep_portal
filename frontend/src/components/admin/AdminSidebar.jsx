import { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, UserCog, User, LogOut, Menu, X, ChevronDown, Trophy, Megaphone, ClipboardList, UsersRound } from 'lucide-react'
import ConfirmModal from '../common/ConfirmModal'
import { useAuth } from '../../context/useAuth'
import { resolveProfilePictureUrl } from '../../utils/profilePicture'


const NAV_ITEMS = [
  { label: 'Dashboard',         to: '/admin/dashboard',         icon: LayoutDashboard },
  { label: 'Members',           to: '/admin/membership',         icon: Users },
  { label: 'Admins',            to: '/admin/admins',             icon: UserCog },
  { label: 'Officers Roster',   to: '/admin/officers-accounts',  icon: UsersRound },
  { label: 'Achievements',      to: '/admin/achievements',       icon: Trophy },
  { label: 'Announcement',      to: '/admin/announcement',       icon: Megaphone },
  { label: 'Profile',           to: '/admin/profile',            icon: User },
  { label: 'Logs / Audit Trails', to: '/admin/logs',            icon: ClipboardList },
]

function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${className}`}>{children}</span>
  )
}

function SidebarLink({ to, label, icon: Icon, badge, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition',
          isActive
            ? 'bg-white/15 text-white'
            : 'text-blue-100 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden
            className={
              isActive
                ? 'inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white'
                : 'inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/0 text-white'
            }
          >
            <Icon size={18} />
          </span>
          <span className="flex-1">{label}</span>
          {badge ? <span className="ml-auto">{badge}</span> : null}
        </>
      )}
    </NavLink>
  )
}

export default function AdminSidebar({
  mobileOpen,
  setMobileOpen,
  badges = {},
  quickActions = { enabled: true },
  logout,
  onYearEndReset,
  yearEndBusy = false,
  isPresident = false,
}) {
  // Ensure optional props don’t trigger lint errors when not used in some builds.
  void logout
  void quickActions
  const { user } = useAuth()

  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [confirmYearEndOpen, setConfirmYearEndOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const pendingBadge = badges?.pendingMembership
  const newLogsBadge = badges?.newLogs

  const onNavigate = () => setMobileOpen(false)

  const userPosition = user?.position || 'NONE'
  const userCard = useMemo(() => {
    const username = user?.username ? `@${user.username}` : '@admin'
    return { username, userPosition }
  }, [user?.username, userPosition])

  const sidebar = (
    <aside className="bg-[#001F4D] text-white lg:fixed lg:top-6 lg:left-6 lg:w-56 max-h-[calc(100vh-3rem)] w-full overflow-hidden">
      <div className="flex h-full flex-col border-r border-white/10">
        <div className="px-4 py-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-blue-100/70">Admin</p>
          <p className="mt-1 text-base font-bold">Navigation</p>
        </div>

        <div className="px-2 pb-3">
          <div className="rounded-2xl bg-white/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {user?.profile_picture ? (
                  <img
                    src={resolveProfilePictureUrl(user.profile_picture)}
                    alt={user.username}
                    className="h-10 w-10 flex-shrink-0 rounded-full object-cover border-2 border-white/20 overflow-hidden"
                  />
                ) : (
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white border-2 border-white/20">
                    <User size={18} />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{userCard.username}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge className="bg-white/15 text-blue-100 border border-white/10">{userCard.userPosition}</Badge>
                  </div>
                </div>
              </div>

              <div className="relative">
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-2 py-2 text-xs font-semibold hover:bg-white/15"
                  onClick={() => setUserMenuOpen((s) => !s)}
                  aria-label="Open admin user menu"
                >
                  <ChevronDown size={14} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-10 z-10 w-44 rounded-2xl border border-white/10 bg-[#001F4D] shadow-xl">
                    <NavLink
                      to="/admin/profile"
                      onClick={() => {
                        setUserMenuOpen(false)
                        onNavigate()
                      }}
                      className="block px-4 py-3 text-sm text-blue-100 hover:bg-white/10"
                    >
                      View Profile
                    </NavLink>
                    <NavLink
                      to="/admin/edit-profile"
                      onClick={() => {
                        setUserMenuOpen(false)
                        onNavigate()
                      }}
                      className="block px-4 py-3 text-sm text-blue-100 hover:bg-white/10"
                    >
                      Edit Profile
                    </NavLink>
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-left text-sm text-red-200 hover:bg-white/10"
                      onClick={() => {
                        setUserMenuOpen(false)
                        setConfirmLogoutOpen(true)
                      }}
                    >
                      <span className="inline-flex items-center gap-2">
                        <LogOut size={16} /> Logout
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const badge =
                item.to === '/admin/membership'
                  ? typeof pendingBadge === 'number' && pendingBadge > 0
                    ? (
                        <Badge className="bg-white/15 text-white">{pendingBadge > 99 ? '99+' : pendingBadge}</Badge>
                      )
                    : null
                  : item.to === '/admin/logs'
                    ? typeof newLogsBadge === 'number' && newLogsBadge > 0
                      ? (
                          <Badge className="bg-white/15 text-white">{newLogsBadge > 99 ? '99+' : newLogsBadge}</Badge>
                        )
                      : null
                    : null

              return (
                <SidebarLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  badge={badge}
                  onNavigate={onNavigate}
                />
              )
            })}
          </div>
        </nav>

        <div className="shrink-0 px-4 pb-4">
          <button
            type="button"
            onClick={() => setConfirmLogoutOpen(true)}
            className="w-full rounded-full border border-white/20 bg-white/0 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-white/10"
          >
            Sign Out
          </button>

          {isPresident && (
            <button
              type="button"
              disabled={yearEndBusy}
              onClick={() => setConfirmYearEndOpen(true)}
              className="mt-3 w-full rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-white hover:bg-[#003C8F] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {yearEndBusy ? 'Resetting...' : 'Year-End Reset'}
            </button>
          )}
        </div>
      </div>
    </aside>
  )

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/50"
          />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-xs">{sidebar}</div>
        </div>
      )}

      <div className="hidden lg:block">{sidebar}</div>

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

      <ConfirmModal
        isOpen={confirmYearEndOpen}
        variant="info"
        title="Year-End Reset"
        description="This will perform the year-end reset across admin/members data."
        confirmText="Proceed with reset"
        cancelText="Cancel"
        busy={yearEndBusy}
        onConfirm={() => {
          setConfirmYearEndOpen(false)
          if (typeof onYearEndReset === 'function') onYearEndReset()
        }}
        onCancel={() => setConfirmYearEndOpen(false)}
      />
    </>
  )
}


