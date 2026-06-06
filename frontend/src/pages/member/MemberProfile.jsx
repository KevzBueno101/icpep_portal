import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/useAuth'
import { useMember } from '../../context/MemberContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { User, Camera, Save, X, Edit2 } from 'lucide-react'

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
  const { profile, refreshProfile } = useMember()

  const [editMode, setEditMode] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    contact_number: '',
    year_level: '',
    section: '',
    address: '',
    birthdate: '',
  })

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const previewUrlRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    }
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
      address: profile.address || '',
      birthdate: profile.birthdate ? String(profile.birthdate).slice(0, 10) : '',
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

    const maxBytes = 5 * 1024 * 1024
    if (file.size > maxBytes) {
      toast.error('Profile picture must be less than 5MB.')
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
        address: editForm.address,
      }

      if (editForm.birthdate) {
        patchBase.birthdate = editForm.birthdate
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

      await refreshUser()
      await refreshProfile()

      toast.success('Profile updated successfully!')
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
  const displayAvatar = previewUrl || profile?.profile_picture

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
              { label: 'Birthdate', key: 'birthdate', type: 'date', disabled: false },
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

            {/* Address Field (Full Width) */}
            <div className="flex flex-col md:col-span-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Home Address
              </label>
              {!editMode ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 font-medium">
                  {profile?.address || '—'}
                </div>
              ) : (
                <textarea
                  value={editForm.address || ''}
                  onChange={(e) => onChangeEditField('address', e.target.value)}
                  rows="3"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
