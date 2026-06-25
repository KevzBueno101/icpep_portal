import { useAuth } from '../../context/useAuth'
import { useMember } from '../../context/MemberContext'
import MembershipCard from '../../components/member/MembershipCard'
import { CreditCard, ShieldCheck } from 'lucide-react'

export default function MemberIdCard() {
  const { user } = useAuth()
  const { profile } = useMember()

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center justify-center gap-3">
          <CreditCard className="h-8 w-8 text-sky-600" />
          Digital ID Card
        </h1>
        <p className="mt-2 text-slate-600 text-sm">
          Your official ICPEP.SE digital student membership pass. Flip to view the terms and conditions.
        </p>
      </div>

      {/* Main card display area */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center">
        <div className="w-full flex justify-center py-6">
          <MembershipCard
            profile={profile}
            userId={user?.id}
            paymentMethod={profile?.payment_method}
          />
        </div>

        <div className="w-full border-t border-slate-100 pt-5 mt-2 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Official Student Member Pass</h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              This card verifies your membership for the academic year. The front displays your photo and membership details with a QR code. Flip to view the terms and conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
