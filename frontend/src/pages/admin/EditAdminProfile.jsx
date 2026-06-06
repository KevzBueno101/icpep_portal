import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import api from '../../api/axios'
import { useAuth } from '../../context/useAuth'

export default function EditAdminProfile() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    position: '',
    role: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showPositionWarning, setShowPositionWarning] = useState(false)

  const fetchProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/users/admin/profile/')
      setFormData({
        first_name: res.data.first_name ?? '',
        last_name: res.data.last_name ?? '',
        email: res.data.email ?? '',
        username: res.data.username ?? '',
        position: res.data.position ?? '',
        role: res.data.role ?? '',
      })
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to load profile.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const firstName = formData.first_name.trim()
    const lastName = formData.last_name.trim()
    const isPresident = user?.position === 'PRESIDENT'

    if (!firstName || !lastName) {
      const msg = 'Both first name and last name are required.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (isPresident) {
      if (!formData.email || !formData.username) {
        const msg = 'Email and username are required.'
        setError(msg)
        toast.error(msg)
        return
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        const msg = 'Please enter a valid email address.'
        setError(msg)
        toast.error(msg)
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        first_name: firstName,
        last_name: lastName,
      }

      // President can edit additional fields
      if (isPresident) {
        payload.email = formData.email.trim()
        payload.username = formData.username.trim()
        payload.position = formData.position
        payload.role = formData.role
      }

      await api.patch('/users/admin/profile/', payload)

      toast.success('Profile updated successfully')
      setTimeout(() => navigate('/admin/profile'), 350)
    } catch (err) {
      const detail = err?.response?.data?.detail
      const msg = detail || 'Failed to save changes. Please try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-600" />
      </div>
    )
  }

  const isPresident = user?.position === 'PRESIDENT'

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          onClick={() => navigate('/admin/profile')}
        >
          <ArrowLeft size={16} /> Back to Profile
        </button>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="h-28 bg-gradient-to-r from-[#001F4D] to-[#003C8F]" />
        <div className="-mt-12 px-6 pb-6">
          <div className="rounded-2xl bg-white p-5 shadow">
            <h1 className="text-xl font-bold text-slate-900">Edit Admin Profile</h1>
            <p className="mt-1 text-sm text-slate-600">
              {isPresident 
                ? 'As President, you can edit all profile fields.'
                : 'Only <span className="font-semibold">first name</span> and <span className="font-semibold">last name</span> can be edited.'
              }
            </p>

            <form className="mt-5 space-y-4" onSubmit={onSubmit}>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Logged in as</p>
                <p className="mt-1 text-sm text-slate-600">@{user?.username || 'admin'}</p>
                {user?.position && (
                  <p className="mt-1 text-sm text-slate-600">Position: {user.position}</p>
                )}
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-semibold text-slate-700">
                    First Name
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    disabled={saving}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                    value={formData.first_name}
                    onChange={(e) => setFormData((s) => ({ ...s, first_name: e.target.value }))}
                  />
                </div>

                <div>
                  <label htmlFor="last_name" className="block text-sm font-semibold text-slate-700">
                    Last Name
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    disabled={saving}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                    value={formData.last_name}
                    onChange={(e) => setFormData((s) => ({ ...s, last_name: e.target.value }))}
                  />
                </div>
              </div>

              {isPresident && (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                        Email
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        disabled={saving}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                        value={formData.email}
                        onChange={(e) => setFormData((s) => ({ ...s, email: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label htmlFor="username" className="block text-sm font-semibold text-slate-700">
                        Username
                      </label>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        disabled={saving}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                        value={formData.username}
                        onChange={(e) => setFormData((s) => ({ ...s, username: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label htmlFor="position" className="block text-sm font-semibold text-slate-700">
                        Position
                      </label>
                      <select
                        id="position"
                        name="position"
                        required
                        disabled={saving}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                        value={formData.position}
                        onChange={(e) => setFormData((s) => ({ ...s, position: e.target.value }))}
                      >
                        <option value="NONE">None</option>
                        <option value="PRESIDENT">President</option>
                        <option value="TREASURER">Treasurer</option>
                        <option value="SECRETARY">Secretary</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="role" className="block text-sm font-semibold text-slate-700">
                        Role
                      </label>
                      <select
                        id="role"
                        name="role"
                        required
                        disabled={saving}
                        className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                        value={formData.role}
                        onChange={(e) => setFormData((s) => ({ ...s, role: e.target.value }))}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MEMBER">Member</option>
                      </select>
                    </div>
                  </div>

                  {formData.position !== 'PRESIDENT' && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                        <p>
                          <strong>Warning:</strong> You are changing your position from President. This will transfer your presidential access to the new position. Use this for proper turnover when your term ends.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                  onClick={() => navigate('/admin/profile')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

