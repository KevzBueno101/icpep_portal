import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { publicApi } from '../../api/axios'
import toast from 'react-hot-toast'

const TOKEN_ERRORS = ['invalid or has expired', 'Invalid reset link']

export default function ResetPassword() {
  const { uidb64, token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
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
      await publicApi.post('/auth/reset-password/', { uidb64, token, password })
      setDone(true)
      toast.success('Password reset successful!')
      setTimeout(() => navigate('/login', { replace: true }), 2000)
    } catch (err) {
      const status = err.response?.status
      const detail = err.response?.data?.detail
      const msg = detail || 'This reset link is invalid or has expired.'
      toast.error(msg)
      setError(status === 429 ? '__RATE_LIMITED__' : msg)
    } finally {
      setLoading(false)
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

            {error === '__RATE_LIMITED__' ? (
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-800">
                <p className="font-semibold mb-1">Too many attempts</p>
                <p className="text-orange-700">
                  Please wait a minute before trying again.
                </p>
              </div>
            ) : error && TOKEN_ERRORS.some((kw) => error.toLowerCase().includes(kw)) ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <p className="font-semibold mb-1">Link expired or invalid</p>
                <p className="text-amber-700">
                  Password reset links expire after 24 hours or when used once.{' '}
                  <Link
                    to="/forgot-password"
                    className="text-amber-900 underline hover:text-amber-950 font-semibold"
                  >
                    Request a new link
                  </Link>
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
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
