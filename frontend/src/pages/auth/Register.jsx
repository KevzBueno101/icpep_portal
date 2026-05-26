import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const YEAR_LEVELS = [
  { value: '1', label: '1st Year' },
  { value: '2', label: '2nd Year' },
  { value: '3', label: '3rd Year' },
  { value: '4', label: '4th Year' },
]

const Field = ({ label, name, type = 'text', placeholder, value, onChange, required = true }) => (
  <div>
    <label className="block text-sm text-slate-600 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500"
    />
  </div>
)

const PasswordField = ({ label, name, value, onChange, show, onToggle }) => (
  <div className="relative">
    <label className="block text-sm text-slate-600 mb-1">{label}</label>
    <input
      type={show ? 'text' : 'password'}
      name={name}
      value={value}
      onChange={onChange}
      required
      className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 pr-14 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500"
      placeholder="••••••••"
    />
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      className="absolute inset-y-0 right-3 flex h-full items-center justify-center px-2 text-slate-500 hover:text-slate-900"
    >
      {show ? (
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
)

const Register = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [previewUrl, setPreviewUrl] = useState('')
  const [form, setForm] = useState({
    email: '', username: '', password: '', confirm_password: '',
    first_name: '', middle_name: '', last_name: '',
    student_number: '', course: 'BSCpE', year_level: '', section: '', contact_number: '',
    profile_picture: null,
  })

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] ?? null
    setForm({ ...form, profile_picture: file })
  }

  useEffect(() => {
    if (!form.profile_picture) {
      setPreviewUrl('')
      return
    }

    const objectUrl = URL.createObjectURL(form.profile_picture)
    setPreviewUrl(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [form.profile_picture])

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3))
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match.')
      return
    }

    const payload = new FormData()
    Object.entries(form).forEach(([key, value]) => {
      if (value !== null) {
        payload.append(key, value)
      }
    })

    setLoading(true)
    try {
      await register(payload)
      toast.success('Registered successfully!')
      navigate('/dashboard')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        Object.values(errors).forEach((msg) => toast.error(Array.isArray(msg) ? msg[0] : msg))
      } else {
        toast.error('Registration failed.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/icpep_logo.png" alt="ICPEP.SE Logo" className="h-16 w-auto" />
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Create an Account</h1>
            <p className="text-slate-500 mt-1 text-sm">ICPEP.SE Membership Registration</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Step {step} of 3</p>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((item) => (
                <span
                  key={item}
                  className={`h-2 w-8 rounded-full ${step >= item ? 'bg-sky-600' : 'bg-slate-200'}`}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-sky-600 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Account Info</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Email" name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} />
                <Field label="Username" name="username" placeholder="username" value={form.username} onChange={handleChange} />
                <PasswordField label="Password" name="password" value={form.password} onChange={handleChange} show={showPassword} onToggle={() => setShowPassword((prev) => !prev)} />
                <PasswordField label="Confirm Password" name="confirm_password" value={form.confirm_password} onChange={handleChange} show={showConfirmPassword} onToggle={() => setShowConfirmPassword((prev) => !prev)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Personal Info</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="First Name" name="first_name" placeholder="Juan" value={form.first_name} onChange={handleChange} />
                <Field label="Middle Name" name="middle_name" placeholder="(optional)" value={form.middle_name} onChange={handleChange} required={false} />
                <Field label="Last Name" name="last_name" placeholder="Dela Cruz" value={form.last_name} onChange={handleChange} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest">Student Info</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Student Number" name="student_number" placeholder="2021-00001" value={form.student_number} onChange={handleChange} />
                <Field label="Contact Number" name="contact_number" placeholder="09xxxxxxxxx" value={form.contact_number} onChange={handleChange} />
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Course</label>
                  <input
                    name="course"
                    type="text"
                    value="BSCpE"
                    disabled
                    className="w-full bg-slate-100 text-slate-500 rounded-lg px-4 py-3 text-sm cursor-not-allowed ring-1 ring-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Year Level</label>
                  <select
                    name="year_level"
                    value={form.year_level}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-100 text-slate-900 rounded-lg px-4 py-3 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Select year</option>
                    {YEAR_LEVELS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
                  </select>
                </div>
                <Field label="Section" name="section" placeholder="A" value={form.section} onChange={handleChange} />
              </div>

              <div className="space-y-3">
                <label className="block text-sm text-slate-600 mb-1">Profile Picture</label>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="h-24 w-24 rounded-full bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-slate-400 text-xs text-center px-2">No image selected</span>
                    )}
                  </div>
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-200">
                    Choose Image
                    <input
                      type="file"
                      name="profile_picture"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1}
              className="w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Back
            </button>
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="w-full sm:w-auto rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
              >
                {loading ? 'Registering...' : 'Create Account'}
              </button>
            )}
          </div>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-sky-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register
