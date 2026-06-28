import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { publicApi } from '../../api/axios'
import toast from 'react-hot-toast'

const AdminLogin = () => {
  const { adminLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [failedCount, setFailedCount] = useState(0)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await adminLogin(form.email, form.password)
      setFailedCount(0)
      toast.success(`Welcome, ${user.position}!`)
      navigate('/admin/dashboard')
    } catch (err) {
      const data = err.response?.data
      const msg =
        data?.non_field_errors?.[0] ||
        data?.detail ||
        'Login failed.'
      const nextCount = failedCount + 1
      setFailedCount(nextCount)
      toast.error(msg)

      if (err.response?.status === 429) {
        toast.error('Too many attempts. Reset your password or try again later.', { duration: 5000 })
      }

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
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4 relative overflow-hidden">

      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-blue-600 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-700 rounded-full opacity-10 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">

        {/* Top label */}
        <div className="flex items-center gap-2 mb-8">
          <div className="h-px flex-1 bg-gray-800" />
          <span className="text-[10px] tracking-[0.3em] text-gray-600 uppercase font-mono">
            Restricted Access
          </span>
          <div className="h-px flex-1 bg-gray-800" />
        </div>

        {/* Card */}
        <div className="bg-[#0f0f18] border border-gray-800/60 rounded-2xl p-8 shadow-2xl shadow-black/60">

          {/* Shield icon */}
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-600/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-center text-white font-semibold text-lg tracking-tight mb-1">
            Admin Portal
          </h1>
          <p className="text-center text-gray-600 text-xs mb-8 font-mono">
            ICPEP.SE — Authorized Personnel Only
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-mono tracking-wide">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="admin@icpep.edu"
                className="w-full bg-[#0a0a0f] border border-gray-800 text-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition placeholder-gray-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-mono tracking-wide">
                PASSWORD
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-[#0a0a0f] border border-gray-800 text-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm outline-none focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/20 transition placeholder-gray-700 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition"
                >
                  {showPass ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {failedCount >= 3 && (
              <div className="text-right -mt-2">
                <Link
                  to={`/forgot-password${form.email ? `?email=${encodeURIComponent(form.email)}` : ''}`}
                  className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 underline"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>

        {/* Bottom disclaimer */}
        <p className="text-center text-[10px] text-gray-700 mt-6 font-mono">
          Unauthorized access attempts are logged and monitored.
        </p>
      </div>
    </div>
  )
}

export default AdminLogin