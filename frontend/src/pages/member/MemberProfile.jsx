import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/useAuth'
import { useMember } from '../../context/MemberContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { EVENTS } from '../../utils/events'
import { downloadFile } from '../../utils/download'
import { User, Camera, Save, X, Edit2, Download } from 'lucide-react'

const YEAR_LABEL_BY_VALUE = {
  '1': '1st Year',
  '2': '2nd Year',
  '3': '3rd Year',
  '4': '4th Year',
}

const getInitials = (firstName) => {
  if (!firstName) return ''
  return String(firstName).trim().slice(0, 1).toUpperCase()
}

const safeDetailFromError = (err) => {
  return (
    err?.response?.data?.detail ||
    err?.response?.data?.[0]?.msg ||
    err?.response?.data?.message ||
    err?.message ||
    'Unable to complete the request.'
  )
}

export default function MemberProfile() {
  const { user, refreshUser } = useAuth()
  const { profile, refreshProfile, profileCacheKey } = useMember()

  const [editMode, setEditMode] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    contact_number: '',
    year_level: '',
    section: '',
  })

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const resetPasswordForm = () => setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const previewUrlRef = useRef(null)
  const fileInputRef = useRef(null)

  const [transactions, setTransactions] = useState([])
  const [txnLoading, setTxnLoading] = useState(true)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const fetchTransactions = async () => {
      try {
        const res = await api.get('/members/transactions/')
        if (!cancelled) setTransactions(res.data.results ?? res.data)
      } catch {
        // non-critical
      } finally {
        if (!cancelled) setTxnLoading(false)
      }
    }
    fetchTransactions()
    return () => { cancelled = true }
  }, [])

  const enterEditMode = () => {
    if (!profile) return
    setEditMode(true)
    setEditForm({
      first_name: profile.first_name || '',
      middle_name: profile.middle_name || '',
      last_name: profile.last_name || '',
      contact_number: profile.contact_number || '',
      year_level: profile.year_level ?? '',
      section: profile.section || '',
    })
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const cancelEdit = () => {
    if (editSaving) return
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
    setEditMode(false)
    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const onAvatarClick = () => {
    if (!editMode) return
    fileInputRef.current?.click()
  }

  const onSelectProfilePicture = (file) => {
    if (!file) return

    const maxBytes = 10 * 1024 * 1024
    if (file.size > maxBytes) {
      toast.error('Profile picture must be less than 10MB.')
      return
    }

    if (file.type && !file.type.startsWith('image/')) {
      toast.error('Profile picture must be an image file.')
      return
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
    }

    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setPreviewUrl(url)
    setSelectedFile(file)
  }

  const onChangeEditField = (key, value) => {
    setEditForm((prev) => ({ ...prev, [key]: value }))
  }

  const saveProfile = async () => {
    if (!profile) return
    setEditSaving(true)

    try {
      const patchBase = {
        first_name: editForm.first_name,
        middle_name: editForm.middle_name,
        last_name: editForm.last_name,
        contact_number: editForm.contact_number,
        year_level: editForm.year_level,
        section: editForm.section,
      }

      if (selectedFile) {
        const fd = new FormData()
        Object.entries(patchBase).forEach(([k, v]) => {
          fd.append(k, v)
        })
        fd.append('profile_picture', selectedFile)
        await api.patch(`/members/${profile.id}/`, fd)
      } else {
        await api.patch(`/members/${profile.id}/`, patchBase)
      }

      // Change password if requested
      if (passwordForm.new_password) {
        if (!passwordForm.current_password) {
          toast.error('Current password is required to change password.')
          return
        }
        if (passwordForm.new_password !== passwordForm.confirm_password) {
          toast.error('New password and confirmation do not match.')
          return
        }
        if (passwordForm.new_password.length < 8) {
          toast.error('New password must be at least 8 characters.')
          return
        }
        await api.post('/auth/change-password/', {
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
          confirm_password: passwordForm.confirm_password,
        })
      }

      await refreshUser()
      await refreshProfile()

      window.dispatchEvent(new CustomEvent(EVENTS.PROFILE_UPDATED))

      toast.success('Profile updated successfully!')
      resetPasswordForm()
      setEditMode(false)
      setSelectedFile(null)
      setPreviewUrl(null)
    } catch (err) {
      console.error(err)
      toast.error(safeDetailFromError(err))
    } finally {
      setEditSaving(false)
    }
  }

  const avatarInitial = getInitials(profile?.first_name || user?.first_name)
  const displayAvatar = previewUrl || (profile?.profile_picture ? `${profile.profile_picture}${profile.profile_picture.includes('?') ? '&' : '?'}_=${profileCacheKey}` : null)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <User className="h-8 w-8 text-sky-600" />
          My Profile
        </h1>
        <p className="mt-2 text-slate-600 text-sm md:text-base">
          Manage your personal details, contact number, year level, and profile avatar.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Profile Card Header Cover */}
        <div className="h-32 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 relative" />

        <div className="px-6 pb-8 relative">
          {/* Avatar Container */}
          <div className="relative -mt-16 mb-6 flex justify-between items-end">
            <button
              type="button"
              onClick={onAvatarClick}
              disabled={!editMode}
              className={`relative rounded-full h-28 w-28 overflow-hidden border-4 border-white bg-slate-200 shadow-md ${
                editMode ? 'cursor-pointer hover:brightness-90 transition' : 'cursor-default'
              }`}
            >
              {displayAvatar ? (
                <img src={displayAvatar} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-sky-600 text-white text-3xl font-bold">
                  {avatarInitial}
                </div>
              )}

              {editMode && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white">
                  <Camera className="h-6 w-6" />
                </div>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                onSelectProfilePicture(file)
                e.target.value = ''
              }}
            />

            {/* Actions */}
            {!editMode ? (
              <button
                type="button"
                onClick={enterEditMode}
                className="flex items-center gap-2 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition shadow-sm"
              >
                <Edit2 className="h-4 w-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={editSaving}
                  className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={editSaving}
                  className="flex items-center gap-1.5 rounded-2xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 transition disabled:opacity-60 shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>{editSaving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Form details */}
          <div className="grid gap-6 md:grid-cols-2">
            {[
              { label: 'First Name', key: 'first_name', disabled: false },
              { label: 'Middle Name', key: 'middle_name', disabled: false },
              { label: 'Last Name', key: 'last_name', disabled: false },
              { label: 'Email Address', key: 'email', value: user?.email || '', disabled: true },
              { label: 'Student Number', key: 'student_number', value: profile?.student_number || '', disabled: true },
              { label: 'Contact Number', key: 'contact_number', disabled: false },
              { label: 'Course', key: 'course', value: profile?.course || '', disabled: true },
              { label: 'Section/Block', key: 'section', disabled: false },
            ].map((field) => {
              const isReadOnly = !editMode || field.disabled
              const value = field.value !== undefined ? field.value : (editMode ? editForm[field.key] : profile?.[field.key])

              return (
                <div key={field.key} className="flex flex-col">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    {field.label}
                  </label>
                  {isReadOnly ? (
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 font-medium">
                      {value || '—'}
                    </div>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={value || ''}
                      onChange={(e) => onChangeEditField(field.key, e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                    />
                  )}
                </div>
              )
            })}

            {/* Year Level Select */}
            <div className="flex flex-col">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Year Level
              </label>
              {!editMode ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 font-medium">
                  {YEAR_LABEL_BY_VALUE[String(profile?.year_level ?? '')] || profile?.year_level || '—'}
                </div>
              ) : (
                <select
                  value={editForm.year_level || ''}
                  onChange={(e) => onChangeEditField('year_level', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                >
                  <option value="">Select Year</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {editMode && (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <svg className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Change Password
            </h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <p className="text-sm text-slate-500">Leave blank to keep your current password.</p>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm((s) => ({ ...s, current_password: e.target.value }))}
                  placeholder="Required to change"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => setPasswordForm((s) => ({ ...s, new_password: e.target.value }))}
                  placeholder="Min 8 characters"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) => setPasswordForm((s) => ({ ...s, confirm_password: e.target.value }))}
                  placeholder="Re-enter new password"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment History */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
            Payment History
          </h2>
        </div>
        <div className="px-6 py-5">
          {txnLoading ? (
            <div className="text-sm text-slate-400 text-center py-6">Loading transactions…</div>
          ) : transactions.length === 0 ? (
            <div className="text-sm text-slate-400 text-center py-6">No payment transactions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="pb-2 pr-3 whitespace-nowrap">Ref #</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">Date</th>
                    <th className="pb-2 pr-3 whitespace-nowrap hidden sm:table-cell">Type</th>
                    <th className="pb-2 pr-3 whitespace-nowrap hidden md:table-cell">Method</th>
                    <th className="pb-2 pr-3 whitespace-nowrap">Status</th>
                    <th className="pb-2 whitespace-nowrap">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-3 pr-3 font-mono text-xs text-slate-700 whitespace-nowrap">
                        {txn.reference_number}
                      </td>
                      <td className="py-3 pr-3 text-slate-700 whitespace-nowrap">
                        {new Date(txn.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-3 text-slate-700 whitespace-nowrap hidden sm:table-cell">
                        {txn.transaction_type_display}
                      </td>
                      <td className="py-3 pr-3 text-slate-700 whitespace-nowrap hidden md:table-cell">
                        {txn.payment_method_display}
                      </td>
                      <td className="py-3 pr-3 whitespace-nowrap">
                        <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          {txn.status_display}
                        </span>
                      </td>
                      <td className="py-3 whitespace-nowrap">
                        {txn.receipt_image ? (
                          <div className="flex gap-2">
                            <a
                              href={txn.receipt_image}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              View
                            </a>
                            <button
                              type="button"
                              onClick={() => downloadFile(txn.receipt_image, `ICPEP_Receipt_${txn.reference_number}.png`)}
                              className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
