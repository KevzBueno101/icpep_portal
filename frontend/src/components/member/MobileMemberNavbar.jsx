import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, Bell, CreditCard, Info, User } from 'lucide-react'

const NAV_ITEMS = [
  { key: 'home', label: 'Home', to: '/member/dashboard', Icon: Home },
  { key: 'announcements', label: 'Announcements', to: '/member/announcements', Icon: Bell },
  { key: 'id', label: 'Digital ID', to: '/member/id', Icon: CreditCard },
  { key: 'about', label: 'About Org', to: '/member/about', Icon: Info },
  { key: 'profile', label: 'Profile', to: '/member/profile', Icon: User },
]

export default function MobileMemberNavbar({ announcementsBadge = 0 }) {
  const { pathname } = useLocation()

  const activeKey = useMemo(() => {
    const p = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

    const found = NAV_ITEMS.find((item) => {
      const t = item.to.endsWith('/') ? item.to.slice(0, -1) : item.to
      return p === t || p.startsWith(`${t}/`)
    })

    if (!found && p === '/dashboard') return 'home'

    return found?.key || 'home'
  }, [pathname])

  return (
    <nav
      role="navigation"
      aria-label="Member mobile navigation"
      className="md:hidden fixed bottom-6 left-1/2 z-50 w-[92vw] max-w-[420px] -translate-x-1/2 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="rounded-[28px] bg-white/90 backdrop-blur-lg border border-white/40 shadow-[0_12px_36px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.03)] px-3 py-2 flex items-center justify-around h-[72px]">
        {NAV_ITEMS.map((item) => {
          const isActive = activeKey === item.key
          const Icon = item.Icon

          return (
            <Link
              key={item.key}
              to={item.to}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex items-center justify-center select-none outline-none group"
            >
              {/* Active Glow Pill Background */}
              <div
                className={`flex items-center justify-center transition-all duration-300 ease-out ${
                  isActive
                    ? 'bg-sky-500/10 text-sky-600 px-5 py-2.5 rounded-2xl shadow-[0_4px_16px_rgba(14,165,233,0.18)] scale-105 border border-sky-500/10'
                    : 'text-slate-500 hover:text-slate-800 p-2.5 rounded-2xl'
                }`}
              >
                <Icon
                  className={`h-5.5 w-5.5 transition-transform duration-300 ${
                    isActive ? 'scale-110 stroke-[2.25px]' : 'scale-100 hover:scale-105 stroke-[2px]'
                  }`}
                />

                {/* Badge for Announcements */}
                {item.key === 'announcements' && announcementsBadge > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                  </span>
                )}
              </div>

              {/* Keyboard Focus Ring */}
              <span className="absolute inset-0 z-20 rounded-2xl focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 pointer-events-none" />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
