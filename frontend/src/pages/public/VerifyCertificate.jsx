import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BadgeCheck, ShieldX, Loader2 } from 'lucide-react'
import { publicApi } from '../../api/axios'

export default function VerifyCertificate() {
  const { code } = useParams()
  const [state, setState] = useState({ loading: true, data: null })

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await publicApi.get('/certificates/verify/', { params: { code } })
        if (!cancelled) setState({ loading: false, data: res.data })
      } catch {
        if (!cancelled) setState({ loading: false, data: { valid: false } })
      }
    }
    run()
    return () => { cancelled = true }
  }, [code])

  const formatDate = (value) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4 dark:bg-slate-900">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <img src="/icpep_logo.png" alt="ICpEP.SE" className="mx-auto h-14 w-14 rounded-full object-contain" />
        <h1 className="mt-3 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Certificate Verification</h1>

        {state.loading ? (
          <div className="py-10">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-sky-500" />
            <p className="mt-3 text-sm text-slate-500">Checking certificate…</p>
          </div>
        ) : state.data?.valid ? (
          <div className="mt-6">
            <BadgeCheck className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="mt-2 font-bold text-emerald-600 dark:text-emerald-400">This certificate is authentic.</p>

            <dl className="mt-6 space-y-3 text-left">
              <div className="rounded-2xl border border-slate-100 bg-slate-100/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/50">
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Recipient</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">{state.data.member_name}</dd>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-100/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/50">
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Event</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">{state.data.event_name}</dd>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-100/70 px-4 py-3 dark:border-slate-700 dark:bg-slate-700/50">
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">Date</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(state.data.event_date)}</dd>
              </div>
            </dl>

            <p className="mt-5 font-mono text-xs text-slate-500 dark:text-slate-400">{state.data.verification_code}</p>
          </div>
        ) : (
          <div className="mt-6">
            <ShieldX className="mx-auto h-12 w-12 text-red-400" />
            <p className="mt-2 font-bold text-red-600">Certificate not found or has been revoked.</p>
            <p className="mt-2 text-sm text-slate-500">
              The code may be incorrect, or this certificate is no longer valid.
            </p>
          </div>
        )}

        <Link to="/landing" className="mt-8 inline-block text-sm font-semibold text-sky-600 hover:underline">
          Go to ICpEP.SE Portal
        </Link>
      </div>
    </div>
  )
}
