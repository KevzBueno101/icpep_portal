import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useMember } from '../context/MemberContext'
import DesktopMemberNavbar from '../components/member/DesktopMemberNavbar'
import MobileMemberNavbar from '../components/member/MobileMemberNavbar'
import { LogOut } from 'lucide-react'

export default function MemberLayout({ children }) {
  const { user, logout, loading: authLoading } = useAuth()
  const { announcements, profileLoading, profile } = useMember()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const isLoading = authLoading || profileLoading

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Not Found</h2>
          <p className="text-slate-600 mb-6">We were unable to locate your member profile. Please contact an administrator or check your registration status.</p>
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 shadow-md transition-all"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-8 transition-colors duration-200">
      {/* Desktop Header */}
      <DesktopMemberNavbar user={user} onLogout={() => setShowLogoutConfirm(true)} />

      {/* Mobile Header (sticky top) */}
      <header className="md:hidden sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <img
              src="/icpep_logo.png"
              alt="ICPEP Logo"
              className="h-8 w-8 rounded-lg ring-1 ring-slate-200 bg-white"
            />
            <span className="font-bold text-base text-slate-900 tracking-wider">
              ICPEP<span className="text-sky-600">.SE</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 transition shadow-sm"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>

      {/* Mobile Footer Navigation */}
      <MobileMemberNavbar announcementsBadge={announcements?.length || 0} />

      {/* Logout Confirmation Modal Overlay */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4">
              <LogOut className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 text-center mb-1">Confirm Logout</h3>
            <p className="text-slate-600 text-center text-sm mb-6">Are you sure you want to log out of your student member account?</p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={logout}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-sm font-semibold text-white hover:bg-red-700 transition shadow-sm shadow-red-600/20"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
