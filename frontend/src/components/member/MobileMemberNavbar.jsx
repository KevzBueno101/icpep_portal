import { useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, BookOpen, BadgeCheck, BadgeCheck as BadgeCheckIcon, CreditCard, Home, UserRound } from 'lucide-react'

const cx = (...classes) => classes.filter(Boolean).join(' ')

const NAV_ITEMS = [
  { key: 'home', label: 'Home', to: '/member/dashboard', Icon: Home },
  { key: 'announcements', label: 'Announcements', to: '/member/announcements', Icon: Bell },
  // Use BadgeCheck by default; falls back to CreditCard if you prefer
  { key: 'id', label: 'Digital ID', to: '/member/id', Icon: CreditCard },
  { key: 'rules', label: 'Organization Rules', to: '/member/rules', Icon: BookOpen },
  { key: 'profile', label: 'Edit Profile', to: '/member/profile', Icon: UserRound },
]

export default function MobileMemberNavbar({ announcementsBadge = 0 }) {
  const { pathname } = useLocation()

  const activeKey = useMemo(() => {
    // Normalize to ensure nested paths match.
    const p = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname

    const found = NAV_ITEMS.find((item) => {
      const t = item.to.endsWith('/') ? item.to.slice(0, -1) : item.to
      return p === t || p.startsWith(`${t}/`)
    })

    // Also allow legacy route /dashboard
    if (!found && p === '/dashboard') return 'home'

    return found?.key || 'home'
  }, [pathname])

  return (
    <nav
      role="navigation"
      aria-label="Member navigation"
      className={cx(
        'md:hidden',
        'fixed bottom-0 left-1/2 z-50 w-[93vw] max-w-[420px] -translate-x-1/2',
        'pb-[env(safe-area-inset-bottom)]',
        'px-2'
      )}
    >
      <div
        className={cx(
          'rounded-[28px]',
          'bg-white/80',
          'backdrop-blur-md',
          'border border-white/30',
          'shadow-xl',
          'mt-3',
          // neumorphism-ish light + depth
          'shadow-black/10'
        )}
      >
        <div className="flex items-stretch justify-between">
          {NAV_ITEMS.map((item) => {
            const isActive = activeKey === item.key
            const Icon = item.Icon

            return (
              <Link
                key={item.key}
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className={cx(
                  'relative flex-1 text-center select-none',
                  'min-h-[56px]',
                  'px-1',
                  'py-2',
                  'outline-none'
                )}
              >
                {/* Active pill */}
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                    'h-10 w-10 md:h-11 md:w-11',
                    'rounded-full',
                    'transition-all duration-300 ease-out',
                    isActive ? 'bg-sky-600/15' : 'bg-transparent',
                    isActive ? 'shadow-[0_0_18px_rgba(2,132,199,0.35)]' : 'shadow-none'
                  )}
                />

                <span
                  className={cx(
                    'relative z-10 inline-flex flex-col items-center justify-center gap-1',
                    'transition-all duration-300 ease-out',
                    'pt-1'
                  )}
                >
                  <span
                    className={cx(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      'transition-all duration-300 ease-out',
                      isActive
                        ? 'text-sky-600 transform scale-105'
                        : 'text-slate-500 group-hover:text-sky-600'
                    )}
                  >
                    <Icon
                      className={cx(
                        'h-6 w-6',
                        'transition-colors duration-300 ease-out',
                        isActive ? 'text-sky-600' : 'text-slate-500'
                      )}
                    />
                  </span>

                  <span
                    className={cx(
                      'text-[11px] font-semibold',
                      'transition-colors duration-300 ease-out',
                      isActive ? 'text-sky-700' : 'text-slate-500'
                    )}
                  >
                    {item.label}
                  </span>

                  {item.key === 'announcements' && announcementsBadge > 0 && (
                    <span
                      className={cx(
                        'absolute -right-0 -top-0',
                        'inline-flex items-center justify-center',
                        'min-w-[18px] h-[18px]',
                        'rounded-full bg-sky-600 text-white',
                        'text-[10px] font-bold px-1',
                        'shadow-[0_0_14px_rgba(2,132,199,0.35)]'
                      )}
                    >
                      {announcementsBadge > 99 ? '99+' : announcementsBadge}
                    </span>
                  )}
                </span>

                {/* Hover lift */}
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute inset-0 z-0 rounded-[28px]',
                    'transition-transform duration-300 ease-out',
                    !isActive ? 'group-hover:-translate-y-0.5' : ''
                  )}
                />

                {/* Keyboard focus */}
                <span
                  aria-hidden="true"
                  className={cx(
                    'absolute inset-0 z-20 rounded-[28px]',
                    'focus-visible:outline-none',
                    'focus-visible:ring-4 focus-visible:ring-sky-200/70'
                  )}
                />
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

