import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import ConfirmModal from '../common/ConfirmModal'


const NAV_ITEMS = [
  { label: 'Dashboard', to: '/admin/dashboard' },
  { label: 'Membership', to: '/admin/membership' },
  { label: 'Admins', to: '/admin/admins' },
  { label: 'Achievements', to: '/admin/achievements' },
  { label: 'Announcement', to: '/admin/announcement' },
  { label: 'Archives', to: '/admin/archives' },
  { label: 'Profile', to: '/admin/profile' },
  { label: 'Logs / Audit Trails', to: '/admin/logs' },
]

const ICONS = {
  '/admin/dashboard': (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10.5z" />
    </svg>
  ),
  '/admin/membership': (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 20h5v-2a4 4 0 0 0-4-4h-1" />
      <path d="M9 20H4v-2a4 4 0 0 1 4-4h1" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  '/admin/admins': (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l7 4.5v5.5c0 5.5-3.8 10.7-7 12-3.2-1.3-7-6.5-7-12V6.5L12 2z" />
      <path d="M9 12h6" />
    </svg>
  ),
  '/admin/achievements': (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  '/admin/announcement': (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5a8.5 8.5 0 0 0 16 4.5V6a8.5 8.5 0 0 0-16 4.5z" />
      <path d="M7 9v6" />
      <path d="M11 9l2 2-2 2" />
    </svg>
  ),
  '/admin/archives': (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6H4v12h16V6z" />
      <path d="M4 10h16" />
      <path d="M9 14h6" />
    </svg>
  ),
  '/admin/profile': (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20c0-3 2.5-5 6-5s6 2 6 5" />
    </svg>
  ),
  '/admin/logs': (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8" />
      <path d="M8 7h8" />
      <path d="M9 11h6" />
      <path d="M17 3v18H7V3h10z" />
    </svg>
  ),
}

function SidebarLink({ to, label, badge, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
              'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition',
              isActive
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
            ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            aria-hidden
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition ${
              isActive
                ? 'border border-sky-400 bg-sky-500 text-white'
                : 'border border-slate-200 bg-white text-slate-700 group-hover:border-sky-200'
            }`}
          >
            {ICONS[to]}
          </span>

          <span className="flex-1">{label}</span>
          {typeof badge === 'number' && badge > 0 && (
            <span
              className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                isActive
                  ? 'bg-sky-400 text-white'
                  : badge > 9
                  ? 'bg-white text-sky-700'
                  : 'bg-white/20 text-slate-900'
              }`}
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}


const AdminSidebar = ({
  mobileOpen,
  setMobileOpen,
  quickActions,
  badges,
  logout,
  onYearEndReset,
  yearEndBusy,
  isPresident,
}) => {
  const location = useLocation()

  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)
  const [confirmYearEndOpen, setConfirmYearEndOpen] = useState(false)

  const pendingBadge = badges?.pendingMembership
  const newLogsBadge = badges?.newLogs

  const onNavigate = () => setMobileOpen(false)

  return (
    <>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50">

          <div
            role="button"
            tabIndex={0}
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />
          <aside className="absolute left-0 top-0 bottom-0 flex h-screen w-[86%] max-w-xs flex-col bg-white shadow-xl ring-1 ring-slate-200 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-4 shrink-0">

              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Admin</p>
                <p className="mt-1 text-sm font-bold text-slate-900">Navigation</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-xl p-2 text-slate-700 hover:bg-slate-100"
                aria-label="Close admin navigation"
              >
                ✕
              </button>
            </div>



            <div className="flex-1 min-h-0">
              <nav className="px-3 pb-6">
                {NAV_ITEMS.map((item) => (
                  <SidebarLink
                    key={item.to}
                    to={item.to}
                    label={item.label}
                    badge={
                      item.to === '/admin/membership'
                        ? pendingBadge
                        : item.to === '/admin/logs'
                          ? newLogsBadge
                          : undefined
                    }
                    onNavigate={onNavigate}
                  />
                ))}
              </nav>
            </div>


            {/* Bottom actions (mobile) */}
            <div className="shrink-0 border-t border-slate-200 p-4">

              <button
                type="button"
                onClick={() => setConfirmLogoutOpen(true)}
                className="w-full rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Sign Out
              </button>

              {isPresident && (
                <button
                  type="button"
                  disabled={yearEndBusy}
                  onClick={() => setConfirmYearEndOpen(true)}
                  className="mt-3 w-full rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {yearEndBusy ? 'Resetting...' : 'Year-End Reset'}
                </button>
              )}
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
          logout()
        }}
        onCancel={() => setConfirmLogoutOpen(false)}
      />

      <ConfirmModal
        isOpen={confirmYearEndOpen}
        variant="info"
        title="Year-End Reset"
        description="This will perform the year-end reset across admin/members data. You may need to review the results afterwards."
        confirmText="Proceed with reset"
        cancelText="Cancel"
        busy={yearEndBusy}
        onConfirm={() => {
          setConfirmYearEndOpen(false)
          onYearEndReset()
        }}
        onCancel={() => setConfirmYearEndOpen(false)}
      />

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:sticky lg:top-0 w-72 shrink-0 flex-col border-r border-slate-200 bg-white h-screen overflow-y-auto">


        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-5 py-5">

          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Admin</p>
          <p className="mt-1 text-lg font-bold text-slate-900">Dashboard</p>

          {quickActions?.enabled !== false && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Quick actions</p>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-700">
                <span>Pending</span>
                <span className="font-bold text-slate-900">{pendingBadge ?? 0}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-slate-700">
                <span>New logs</span>
                <span className="font-bold text-slate-900">{newLogsBadge ?? 0}</span>
              </div>
            </div>
          )}
        </div>

        <nav className="px-3 pb-6">
          {NAV_ITEMS.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              label={item.label}
              badge={
                item.to === '/admin/membership'
                  ? pendingBadge
                  : item.to === '/admin/logs'
                    ? newLogsBadge
                    : undefined
              }
            />
          ))}
        </nav>
        </div>


          {/* Bottom actions */}
          <div className="p-4 pt-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmLogoutOpen(true)}
              className="w-full rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sign Out
            </button>

            {isPresident && (
              <button
                type="button"
                disabled={yearEndBusy}
                onClick={() => setConfirmYearEndOpen(true)}
                className="mt-3 w-full rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {yearEndBusy ? 'Resetting...' : 'Year-End Reset'}
              </button>
            )}
          </div>

        </aside>

    </>
  )
}

export default AdminSidebar

