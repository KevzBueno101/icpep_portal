import { Link, useLocation } from 'react-router-dom'
import { Home, Bell, CreditCard, Info, User, LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home', to: '/member/dashboard', Icon: Home },
  { label: 'Announcements', to: '/member/announcements', Icon: Bell },
  { label: 'Digital ID', to: '/member/id', Icon: CreditCard },
  { label: 'About Org', to: '/member/about', Icon: Info },
  { label: 'Profile', to: '/member/profile', Icon: User },
]

export default function DesktopMemberNavbar({ user, onLogout }) {
  const { pathname } = useLocation()

  return (
    <header className="hidden md:block sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/member/dashboard" className="flex items-center gap-2.5 group">
            <img
              src="/icpep_logo.png"
              alt="ICPEP Logo"
              className="h-9 w-9 rounded-lg ring-1 ring-slate-200 bg-white transition group-hover:scale-105"
            />
            <span className="font-bold text-lg text-slate-900 tracking-wider">
              ICPEP<span className="text-sky-600">.SE</span>
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.to
              const Icon = item.Icon

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-sky-600 bg-sky-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-sky-600" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-600 text-white font-bold text-sm shadow-sm">
                {user?.first_name ? user.first_name[0].toUpperCase() : '?'}
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden lg:inline-block">
                {user?.first_name || 'Member'}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-600 transition-all duration-200 shadow-sm"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
