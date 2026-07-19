import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => setIsMobileMenuOpen((isOpen) => !isOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full">
      {/* ── Announcement Banner ── */}
      <div className="navbar-banner-pattern w-full border-b border-[#1e293b]">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-4 py-2 sm:px-6 lg:px-8">
          <p className="text-xs font-medium text-[#f1f5f9] tracking-wide">
            🎉 New academic year registration is now open — sign up today!
          </p>
          <svg
            className="ml-2 h-3.5 w-3.5 text-[#3b82f6]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>

      {/* ── Main Nav Bar ── */}
      <div className="bg-[#0a0a0a] border-b border-[#1e293b]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center gap-3 text-white" onClick={closeMobileMenu}>
                <img src="/icpep_logo.png" alt="ICPEP.SE Logo" className="h-9 w-auto" />
                <span className="text-lg font-bold text-[#f1f5f9]">ICpEP.SE</span>
              </Link>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-center gap-2">
                <Link
                  to="/"
                  className="rounded-md px-3 py-2 text-sm font-medium text-[#94a3b8] transition hover:bg-[#1e293b] hover:text-[#3b82f6]"
                >
                  Home
                </Link>
                <a
                  href="#announcements"
                  className="rounded-md px-3 py-2 text-sm font-medium text-[#94a3b8] transition hover:bg-[#1e293b] hover:text-[#3b82f6]"
                >
                  Announcements
                </a>
                <a
                  href="#milestones"
                  className="rounded-md px-3 py-2 text-sm font-medium text-[#94a3b8] transition hover:bg-[#1e293b] hover:text-[#3b82f6]"
                >
                  Achievements
                </a>
                <a
                  href="#officers"
                  className="rounded-md px-3 py-2 text-sm font-medium text-[#94a3b8] transition hover:bg-[#1e293b] hover:text-[#3b82f6]"
                >
                  Officers
                </a>
                <Link
                  to="/login"
                  className="rounded-md px-4 py-2 text-sm font-semibold text-[#94a3b8] transition hover:bg-[#1e293b] hover:text-[#3b82f6]"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2563eb]"
                >
                  Register
                </Link>
              </div>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden">
              <button
                type="button"
                onClick={toggleMobileMenu}
                aria-label="Toggle navigation"
                aria-expanded={isMobileMenuOpen}
                className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[#94a3b8] transition hover:bg-[#1e293b] hover:text-[#3b82f6] focus:outline-none focus:ring-2 focus:ring-[#3b82f6]/60"
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
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-b border-[#1e293b] bg-[#0a0a0a] md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#3b82f6]"
            >
              Home
            </Link>
            <a
              href="#announcements"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#3b82f6]"
            >
              Announcements
            </a>
            <a
              href="#milestones"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#3b82f6]"
            >
              Achievements
            </a>
            <a
              href="#officers"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-[#94a3b8] hover:bg-[#1e293b] hover:text-[#3b82f6]"
            >
              Officers
            </a>
            <Link
              to="/login"
              onClick={closeMobileMenu}
              className="block rounded-md bg-[#3b82f6] px-3 py-2 text-base font-medium text-white"
            >
              Login
            </Link>
            <Link
              to="/register"
              onClick={closeMobileMenu}
              className="block rounded-md border border-[#3b82f6] px-3 py-2 text-center text-base font-medium text-[#3b82f6]"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
