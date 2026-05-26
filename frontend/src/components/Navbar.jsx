import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => setIsMobileMenuOpen((isOpen) => !isOpen)
  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex-shrink-0">
            <Link to="/" className="flex items-center gap-3 text-slate-900" onClick={closeMobileMenu}>
              <img src="/icpep_logo.png" alt="ICPEP.SE Logo" className="h-9 w-auto" />
              <span className="text-lg font-bold">ICpEP.SE | CatSU Chapter</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-center gap-2">
              <Link
                to="/"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-sky-700"
              >
                Home
              </Link>
              <a
                href="#announcements"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-sky-700"
              >
                Announcements
              </a>
              <a
                href="#officers"
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-sky-700"
              >
                Officers
              </a>
              <Link
                to="/login"
                className="rounded-md px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-700 transition hover:bg-slate-100 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
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
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:text-sky-600"
            >
              Home
            </Link>
            <a
              href="#announcements"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:text-sky-600"
            >
              Announcements
            </a>
            <a
              href="#officers"
              onClick={closeMobileMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-slate-700 hover:text-sky-600"
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
