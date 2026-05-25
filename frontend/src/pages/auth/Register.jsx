import { useState } from 'react'
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
    <label className="block text-sm text-gray-400 mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
)

const Register = () => {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    email: '', username: '', password: '', confirm_password: '',
    first_name: '', middle_name: '', last_name: '',
    student_number: '', course: 'BSCpE', year_level: '', section: '', contact_number: '',
  })

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm_password) {
      toast.error('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await register(form)
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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Create an Account</h1>
          <p className="text-gray-400 mt-1 text-sm">ICPEP.SE Membership Registration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Account Info</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Email" name="email" type="email" placeholder="you@email.com" value={form.email} onChange={handleChange} />
            <Field label="Username" name="username" placeholder="username" value={form.username} onChange={handleChange} />
            <Field label="Password" name="password" type="password" placeholder="••••••••" value={form.password} onChange={handleChange} />
            <Field label="Confirm Password" name="confirm_password" type="password" placeholder="••••••••" value={form.confirm_password} onChange={handleChange} />
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-widest pt-2">Personal Info</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="First Name" name="first_name" placeholder="Juan" value={form.first_name} onChange={handleChange} />
            <Field label="Middle Name" name="middle_name" placeholder="(optional)" value={form.middle_name} onChange={handleChange} required={false} />
            <Field label="Last Name" name="last_name" placeholder="Dela Cruz" value={form.last_name} onChange={handleChange} />
          </div>

          <p className="text-xs text-gray-500 uppercase tracking-widest pt-2">Student Info</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Student Number" name="student_number" placeholder="2021-00001" value={form.student_number} onChange={handleChange} />
            <Field label="Contact Number" name="contact_number" placeholder="09xxxxxxxxx" value={form.contact_number} onChange={handleChange} />

            <div>
              <label className="block text-sm text-gray-400 mb-1">Course</label>
              <input
                type="text"
                value="BSCpE"
                disabled
                className="w-full bg-gray-700 text-gray-400 rounded-lg px-4 py-3 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-1">Year Level</label>
              <select
                name="year_level"
                value={form.year_level}
                onChange={handleChange}
                required
                className="w-full bg-gray-800 text-white rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select year</option>
                {YEAR_LEVELS.map((y) => <option key={y.value} value={y.value}>{y.label}</option>)}
              </select>
            </div>

            <Field label="Section" name="section" placeholder="A" value={form.section} onChange={handleChange} />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50 mt-2"
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

export default Register