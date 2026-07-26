import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { publicApi } from '../../api/axios'
import toast from 'react-hot-toast'

const TOKEN_ERRORS = ['invalid or has expired', 'Invalid reset link', 'has expired']
const MAX_RETRIES = 2
const RETRY_DELAY = 5000

export default function ResetPassword() {
  const { uidb64, token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [done, setDone] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const res = await publicApi.post('/auth/reset-password/', { uidb64, token, password })
          if (res.data?.already_used) {
            toast.success('Password was already reset. Redirecting to login...')
            setTimeout(() => navigate('/login', { replace: true }), 1500)
            return
          }
          setDone(true)
          toast.success('Password reset successful!')
          setTimeout(() => navigate('/login', { replace: true }), 2000)
          return
        } catch (err) {
          const isNetwork = !err.response
          const isServerError = err.response?.status >= 500
          if ((isNetwork || isServerError) && attempt < MAX_RETRIES) {
            setRetrying(true)
            await new Promise((r) => setTimeout(r, RETRY_DELAY))
            continue
          }
          const status = err.response?.status
          const detail = err.response?.data?.detail
          const msg = detail || 'This reset link is invalid or has expired.'
          if (status === 429) {
            toast.error('Too many attempts. Please wait a minute.')
          } else if (!err.response || TOKEN_ERRORS.some((kw) => msg.toLowerCase().includes(kw))) {
            toast.error('This link has expired. Redirecting...')
            setTimeout(() => navigate('/forgot-password', { replace: true }), 1500)
          } else {
            toast.error(msg)
          }
          return
        }
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
      setRetrying(false)
    }
  }

  if (!uidb64 || !token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg text-center">
          <p className="text-slate-600">Invalid reset link.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm text-sky-600 hover:underline font-semibold">
            Request a new reset link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/icpep_logo.png" alt="ICPEP.SE Logo" className="h-16 w-auto" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">
              {done ? 'Password Reset' : 'Choose a New Password'}
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              {done
                ? 'Redirecting to login...'
                : 'Enter your new password below.'}
            </p>
          </div>
        </div>

        {done ? (
          <Link
            to="/login"
            className="block w-full text-center rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition"
          >
            Back to Login
          </Link>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <label className="block text-sm text-slate-600 mb-1">New Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 pr-14 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPass((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex h-full items-center px-2 text-slate-500 hover:text-slate-900"
              >
                {showPass ? (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19.5c-5.52 0-10-4.48-10-10 0-1.44.32-2.8.88-4.02" />
                    <path d="M1 1l22 22" />
                    <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div>
              <label className="block text-sm text-slate-600 mb-1">Confirm Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? (retrying ? 'Waking up server...' : 'Resetting...') : 'Reset Password'}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-sky-600 hover:underline">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
