import { useAuth } from '../../context/useAuth'
import { useMember } from '../../context/MemberContext'
import MembershipCard from '../../components/member/MembershipCard'
import { CreditCard, ShieldCheck, Award, CheckCircle2 } from 'lucide-react'

const MEMBER_BENEFITS = [
  {
    title: 'Official Digital ID',
    description: 'Your official ICPEP.SE digital student membership ID, valid for the academic year.',
  },
  {
    title: 'Events & Activities',
    description: 'Access to ICPEP.SE seminars, trainings, and organization activities.',
  },
  {
    title: 'Networking',
    description: 'Connect with fellow BS CpE students and industry professionals.',
  },
  {
    title: 'Academic Support',
    description: 'Updates on tutorials, board exam reviews, and academic resources.',
  },
  {
    title: 'Discounts & Merch',
    description: 'Exclusive offers on organization merchandise and event registration.',
  },
]

export default function MemberIdCard() {
  const { user } = useAuth()
  const { profile, profileCacheKey } = useMember()

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-3">
          <CreditCard className="h-8 w-8 text-sky-600" />
          Digital ID Card
        </h1>
        <p className="mt-2 text-slate-600 text-sm">
          Your official ICPEP.SE digital student membership pass. Tap to flip to show the verification QR code.
        </p>
      </div>

      {/* Main card display area */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center">
        <div className="w-full flex justify-center py-6">
          <MembershipCard
            profile={profile}
            userId={user?.id}
            paymentMethod={profile?.payment_method}
            cacheKey={profileCacheKey}
          />
        </div>

        <div className="w-full border-t border-slate-100 pt-5 mt-2 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Official Student Member Pass</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Please download and print this ID, it will use for future attendance system.
            </p>
          </div>
        </div>
      </div>

      {/* Member Benefits */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">Member Benefits</h2>
        </div>
        <ul className="space-y-3">
          {MEMBER_BENEFITS.map((benefit) => (
            <li key={benefit.title} className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">{benefit.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{benefit.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
