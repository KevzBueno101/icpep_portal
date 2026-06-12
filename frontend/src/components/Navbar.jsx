import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => setIsMobileMenuOpen((isOpen) => !isOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full border-b border-white/60 bg-white/60 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.55),0_10px_30px_rgba(2,132,199,0.12)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 text-white" onClick={closeMobileMenu}>
              <img src="/icpep_logo.png" alt="ICPEP.SE Logo" className="h-9 w-auto" />
              <span className="text-lg font-bold text-slate-900">ICpEP.SE</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center gap-2">
              <Link
                to="/"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700/90 transition hover:bg-sky-100/40 hover:text-sky-700"
              >
                Home
              </Link>
              <a
                href="#announcements"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700/90 transition hover:bg-slate-900/5 hover:text-cyan-700"
              >
                Announcements
              </a>
              <a
                href="#milestones"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700/90 transition hover:bg-slate-900/5 hover:text-cyan-700"
              >
                Achievements
              </a>
              <a
                href="#officers"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700/90 transition hover:bg-slate-900/5 hover:text-cyan-700"
              >
                Officers
              </a>
              <Link
                to="/login"
                className="rounded-md px-4 py-2 text-sm font-semibold text-slate-700/90 transition hover:bg-sky-100/40 hover:text-sky-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-500/90"
              >
                Register
              </Link>
            </div>
          </div>

          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation"
              aria-expanded={isMobileMenuOpen}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700/90 transition hover:bg-sky-100/50 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500/60"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isMobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="border-t border-white/60 bg-white/60 backdrop-blur-xl md:hidden shadow-[0_0_0_1px_rgba(255,255,255,0.25)]">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700/90 hover:bg-sky-100/40 hover:text-sky-700"
            >
              Home
            </Link>
            <a
              href="#announcements"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700/90 hover:bg-sky-100/40 hover:text-sky-700"
            >
              Announcements
            </a>
            <a
              href="#milestones"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700/90 hover:bg-sky-100/40 hover:text-sky-700"
            >
              Achievements
            </a>
            <a
              href="#officers"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700/90 hover:bg-sky-100/40 hover:text-sky-700"
            >
              Officers
            </a>
            <Link
              to="/login"
              onClick={closeMobileMenu}
              className="block rounded-md bg-sky-600 px-3 py-2 text-base font-medium text-white"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={closeMobileMenu}
              className="block rounded-md border border-sky-600 px-3 py-2 text-center text-base font-medium text-sky-600"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
