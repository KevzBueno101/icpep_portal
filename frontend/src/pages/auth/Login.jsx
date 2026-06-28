import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { publicApi } from '../../api/axios'
import toast from 'react-hot-toast'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failedCount, setFailedCount] = useState(0)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      setFailedCount(0)
      toast.success('Welcome back!')
      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard')
      } else {
        navigate(user.membership_status === 'APPROVED' ? '/member/dashboard' : '/membership-pending')
      }

    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid credentials.'
      const nextCount = failedCount + 1
      setFailedCount(nextCount)
      toast.error(errorMsg)

      // Show rate limit warning if server says 5+
      if (err.response?.status === 429) {
        toast.error('Too many attempts. Reset your password or try again later.', { duration: 5000 })
      }

      // Fetch server-side count to update failedCount non-intrusively
      try {
        const res = await publicApi.get(`/auth/failed-attempts/?email=${encodeURIComponent(form.email)}`)
        if (res.data.count > nextCount) {
          setFailedCount(res.data.count)
        }
      } catch {
        // ignore
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
        <img src="/icpep_logo.png" alt="ICPEP.SE Logo" className="h-16 w-auto" />
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">ICpEP.se Portal</h1>
          <p className="text-slate-500 mt-1 text-sm">Sign in to your account</p>
        </div>
       </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm text-slate-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500"
              placeholder="you@email.com"
            />
          </div>

          <div className="relative">
            <label className="block text-sm text-slate-600 mb-1">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 pr-14 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute inset-y-0 right-3 flex h-full items-center justify-center px-2 text-slate-500 hover:text-slate-900"
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 19.5c-5.52 0-10-4.48-10-10 0-1.44.32-2.8.88-4.02" />
                  <path d="M1 1l22 22" />
                  <path d="M9.88 9.88a3 3 0 0 0 4.24 4.24" />
                  <path d="M14.12 14.12C13.4 14.84 12.29 15.25 11 15.25c-2.21 0-4-1.79-4-4 0-1.29.41-2.4 1.13-3.12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {failedCount >= 3 && (
            <div className="text-right -mt-3">
              <Link
                to={`/forgot-password${form.email ? `?email=${encodeURIComponent(form.email)}` : ''}`}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
              >
                Forgot password?
              </Link>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
<div className="text-center">
            <Link to="/landing" className="inline-flex items-center justify-center text-sky-600 hover:underline text-sm">
              Home
            </Link>
          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            No account yet? {' '} be a member of ICpEP.se and{' '}
            <Link to="/register" className="text-sky-600 hover:underline">
              Register here
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

export default Login
