import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { useMember } from '../context/MemberContext'
import DesktopMemberNavbar from '../components/member/DesktopMemberNavbar'
import MobileMemberNavbar from '../components/member/MobileMemberNavbar'
import { LogOut, HelpCircle, X, Shield, Award, Calendar, DollarSign } from 'lucide-react'

export default function MemberLayout({ children }) {
  const { user, logout, loading: authLoading } = useAuth()
  const { announcements, profileLoading, profile } = useMember()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)

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
    <div className="min-h-screen bg-slate-50 text-slate-900 pt-14 md:pt-16 pb-28 md:pb-8 transition-colors duration-200">
      {/* Desktop Header */}
      <DesktopMemberNavbar
        user={user}
        onLogout={() => setShowLogoutConfirm(true)}
        onHelpClick={() => setShowHelpModal(true)}
      />

      {/* Mobile Header (fixed top) */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-sky-600 transition shadow-sm"
              aria-label="Membership Info"
            >
              <HelpCircle className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-red-600 transition shadow-sm"
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
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

      {/* Membership Info Modal Overlay */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Shield className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">ICPEP.SE Membership Guide</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Fee & Validity */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <DollarSign className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Membership Fees & Validity</h4>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                      Registration costs <span className="font-semibold text-emerald-600">PHP 200.00</span> per student member. It is valid for exactly <span className="font-semibold">one (1) Academic Year</span>, requiring renewal at the start of the next school year. Payments can be settled via GCash or on-hand.
                    </p>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-sky-600" />
                  Member Benefits
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  {[
                    { title: 'Event Discounts', desc: 'Get free or highly-discounted entry passes to local CpE seminars, programming bootcamps, workshops, and team buildings.' },
                    { title: 'CpE Contests', desc: 'Participate in official student competitions like regional/national programming contests, tech quiz bowls, and design project showcases.' },
                    { title: 'Academic Support', desc: 'Access exclusive peer study groups, compiler setups, review repositories, and programming tutorial materials.' },
                    { title: 'Industry Networking', desc: 'Connect directly with professional computer engineers, chapter alumni, guest speakers, and partner tech recruiters.' },
                  ].map((benefit, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-100 bg-white p-3 hover:border-slate-200 transition">
                      <div className="font-bold text-slate-900 mb-0.5">{benefit.title}</div>
                      <div className="text-slate-500 leading-relaxed">{benefit.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-sky-600" />
                  Key Policies
                </h4>
                <ul className="text-xs text-slate-600 space-y-2 pl-4 list-disc leading-relaxed">
                  <li><strong>Non-Transferability:</strong> Membership details and cards are unique to you and cannot be shared or transferred to other students.</li>
                  <li><strong>Active ID Status:</strong> To keep your Digital ID showing <span className="text-emerald-600 font-semibold">VERIFIED</span>, your registered payment and student number must be verified by the chapter treasurer.</li>
                  <li><strong>Refund Policy:</strong> All registration and renewal fees are final, non-refundable, and non-transferable.</li>
                  <li><strong>Organization Conduct:</strong> Members must adhere to the ICPEP.SE constitution and follow active department/laboratory rules.</li>
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 p-4 bg-slate-50 shrink-0 text-center text-xs text-slate-500 font-medium">
              Need assistance? Drop an email to <span className="text-sky-600 font-semibold">treasurer@icpep.se</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
