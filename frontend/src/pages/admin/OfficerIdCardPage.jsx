import { useAuth } from '../../context/useAuth'
import useAdminProfile from '../../hooks/useAdminProfile'
import OfficerIdCard from '../../components/officer/OfficerIdCard'
import { BadgeCheck, ShieldCheck } from 'lucide-react'

export default function OfficerIdCardPage() {
  const { user } = useAuth()
  const { profile, profilePictureUrl, loading, error } = useAdminProfile()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500 text-sm">
        Loading officer ID card...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700 text-sm">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-3">
          <BadgeCheck className="h-8 w-8 text-sky-600" />
          Officer ID Card
        </h1>
        <p className="mt-2 text-slate-600 text-sm">
          Your official ICPEP.SE officer identification card.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center">
        <div className="w-full flex justify-center py-6">
          <OfficerIdCard
            profile={profile}
            user={user}
            profilePictureUrl={profilePictureUrl}
          />
        </div>

        <div className="w-full border-t border-slate-100 pt-5 mt-2 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Official Officer ID Pass</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              This card verifies your officer position for the academic year. Scan the QR code for verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
