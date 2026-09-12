import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { publicApi } from '../../api/axios'
import toast from 'react-hot-toast'
import { OFFICER_GROUPS, positionsForGroup } from '../../utils/officerPositions'

const AdminLogin = () => {
  const { adminLogin } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [failedCount, setFailedCount] = useState(0)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [requestForm, setRequestForm] = useState({
    email: '',
    password: '',
    confirm_password: '',
    first_name: '',
    last_name: '',
    position: 'President',
    department: 'HEAD OFFICE',
    academic_year: '',
  })
  const [requestErrors, setRequestErrors] = useState({})
  const [showReqPass, setShowReqPass] = useState(false)
  const [showReqConfirm, setShowReqConfirm] = useState(false)
  const [profilePic, setProfilePic] = useState(null)
  const [profilePicPreview, setProfilePicPreview] = useState(null)
  const [requestLoading, setRequestLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })
  const handleRequestChange = (e) => setRequestForm({ ...requestForm, [e.target.name]: e.target.value })
  const handleDepartmentChange = (value) => {
    setRequestForm((prev) => {
      const next = { ...prev, department: value }
      if (prev.position && !positionsForGroup(value).includes(prev.position)) {
        next.position = ''
      }
      return next
    })
  }

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
        toast.error('Too many attempts. Please wait 15 minutes and try again.', { duration: 5000 })
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

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePic(file)
      const reader = new FileReader()
      reader.onloadend = () => setProfilePicPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  const handleRequestSubmit = async (e) => {
    e.preventDefault()
    setRequestErrors({})

    const errs = {}
    if (!requestForm.first_name.trim()) errs.first_name = 'First name is required.'
    if (!requestForm.last_name.trim()) errs.last_name = 'Last name is required.'
    if (!requestForm.email.trim()) errs.email = 'Email is required.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requestForm.email.trim())) errs.email = 'Enter a valid email address.'
    if (!requestForm.department) errs.department = 'Department is required.'
    if (!requestForm.position) errs.position = 'Position is required.'
    if (!requestForm.academic_year.trim()) errs.academic_year = 'Academic year is required.'
    if (!requestForm.password) errs.password = 'Password is required.'
    else if (requestForm.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (!requestForm.confirm_password) errs.confirm_password = 'Confirm your password.'
    else if (requestForm.password && requestForm.password !== requestForm.confirm_password) errs.confirm_password = 'Passwords do not match.'

    if (Object.keys(errs).length > 0) {
      setRequestErrors(errs)
      toast.error('Please fix the highlighted fields.')
      return
    }

    setRequestLoading(true)
    try {
      const data = new FormData()
      for (const [k, v] of Object.entries(requestForm)) {
        if (v) data.append(k, v)
      }
      if (profilePic) data.append('profile_picture', profilePic)
      await publicApi.post('/auth/admin-register/', data)
      toast.success('Admin access request submitted. Please wait for President approval.')
      setShowRequestForm(false)
      setProfilePic(null)
      setProfilePicPreview(null)
      setRequestForm({
        email: '',
        password: '',
        confirm_password: '',
        first_name: '',
        last_name: '',
        position: 'President',
        department: 'HEAD OFFICE',
        academic_year: '',
      })
      setRequestErrors({})
    } catch (err) {
      const data = err.response?.data
      const fieldErr = {}
      if (data) {
        for (const [key, val] of Object.entries(data)) {
          if (typeof val === 'string') fieldErr[key] = val
          else if (Array.isArray(val)) fieldErr[key] = val[0]
        }
      }
      setRequestErrors(fieldErr)
      const msg = data?.detail || data?.email?.[0] || data?.password?.[0] || data?.confirm_password?.[0] || 'Unable to submit admin request.'
      toast.error(msg)
    } finally {
      setRequestLoading(false)
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

      {/* Home button */}
      <Link
        to="/landing"
        className="absolute top-5 left-5 z-20 flex items-center gap-2 rounded-lg border border-gray-800 bg-[#0f0f18]/80 px-3 py-2 text-xs font-semibold text-gray-400 transition hover:border-blue-500/40 hover:text-blue-400"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75"
          />
        </svg>
        Home
      </Link>

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
                'Login'
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-gray-800/70 pt-4">
            <button
              type="button"
              onClick={() => { setShowRequestForm((prev) => !prev); setProfilePic(null); setProfilePicPreview(null) }}
              className="w-full rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-300 transition hover:bg-blue-500/20"
            >
              {showRequestForm ? 'Cancel Request' : 'Request Admin Access'}
            </button>

            {showRequestForm && (
              <form onSubmit={handleRequestSubmit} className="mt-4 space-y-3 rounded-xl border border-gray-800 bg-[#0a0a0f] p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <input name="first_name" value={requestForm.first_name} onChange={handleRequestChange} required placeholder="First name" className="w-full rounded-lg border border-gray-800 bg-[#0f0f18] px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500/60" />
                    {requestErrors.first_name && <p className="mt-1 text-xs text-red-400">{requestErrors.first_name}</p>}
                  </div>
                  <div>
                    <input name="last_name" value={requestForm.last_name} onChange={handleRequestChange} required placeholder="Last name" className="w-full rounded-lg border border-gray-800 bg-[#0f0f18] px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500/60" />
                    {requestErrors.last_name && <p className="mt-1 text-xs text-red-400">{requestErrors.last_name}</p>}
                  </div>
                </div>
                <div>
                  <input name="email" type="email" value={requestForm.email} onChange={handleRequestChange} required placeholder="Email" className="w-full rounded-lg border border-gray-800 bg-[#0f0f18] px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500/60" />
                  {requestErrors.email && <p className="mt-1 text-xs text-red-400">{requestErrors.email}</p>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <div className="relative">
                      <input name="password" type={showReqPass ? 'text' : 'password'} value={requestForm.password} onChange={handleRequestChange} required placeholder="Password" className="w-full rounded-lg border border-gray-800 bg-[#0f0f18] px-3 py-2 pr-10 text-sm text-gray-200 outline-none focus:border-blue-500/60" />
                      <button type="button" onClick={() => setShowReqPass((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition">
                        {showReqPass ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {requestErrors.password && <p className="mt-1 text-xs text-red-400">{requestErrors.password}</p>}
                  </div>
                  <div>
                    <div className="relative">
                      <input name="confirm_password" type={showReqConfirm ? 'text' : 'password'} value={requestForm.confirm_password} onChange={handleRequestChange} required placeholder="Confirm password" className="w-full rounded-lg border border-gray-800 bg-[#0f0f18] px-3 py-2 pr-10 text-sm text-gray-200 outline-none focus:border-blue-500/60" />
                      <button type="button" onClick={() => setShowReqConfirm((prev) => !prev)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition">
                        {showReqConfirm ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {requestErrors.confirm_password && <p className="mt-1 text-xs text-red-400">{requestErrors.confirm_password}</p>}
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <select name="department" value={requestForm.department} required onChange={(e) => handleDepartmentChange(e.target.value)} className="w-full rounded-lg border border-gray-800 bg-[#0f0f18] px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500/60">
                      {OFFICER_GROUPS.map((group) => (
                        <option key={group.label} value={group.label}>
                          {group.label}
                        </option>
                      ))}
                    </select>
                    {requestErrors.department && <p className="mt-1 text-xs text-red-400">{requestErrors.department}</p>}
                  </div>
                  <div>
                    <select name="position" value={requestForm.position} required onChange={handleRequestChange} className="w-full rounded-lg border border-gray-800 bg-[#0f0f18] px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500/60">
                      {positionsForGroup(requestForm.department).map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                    </select>
                    {requestErrors.position && <p className="mt-1 text-xs text-red-400">{requestErrors.position}</p>}
                  </div>
                </div>
                <input name="academic_year" value={requestForm.academic_year} onChange={handleRequestChange} required placeholder="Academic year" className="w-full rounded-lg border border-gray-800 bg-[#0f0f18] px-3 py-2 text-sm text-gray-200 outline-none focus:border-blue-500/60" />
                {requestErrors.academic_year && <p className="mt-1 text-xs text-red-400">{requestErrors.academic_year}</p>}
                <label className="flex items-center justify-center w-full h-24 rounded-lg border border-dashed border-gray-700 bg-[#0f0f18] cursor-pointer hover:border-blue-500/60 transition overflow-hidden">
                  {profilePicPreview ? (
                    <img src={profilePicPreview} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-500">Upload profile picture</span>
                  )}
                  <input type="file" accept="image/*" onChange={handleProfilePicChange} className="hidden" />
                </label>
                <button type="submit" disabled={requestLoading} className="w-full rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50">
                  {requestLoading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            )}
          </div>
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