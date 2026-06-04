import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { useAuth } from '../../context/useAuth'
import MembershipCard from '../../components/member/MembershipCard'
import MobileMemberNavbar from '../../components/member/MobileMemberNavbar'


import AnnouncementFeed from '../landing/AnnouncementFeed'


const YEAR_LABEL_BY_VALUE = {
  '1': '1st Year',
  '2': '2nd Year',
  '3': '3rd Year',
  '4': '4th Year',
}

const formatMemberSince = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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

export default function MemberDashboard() {
  const navigate = useNavigate()
  const { user, loading, logout, refreshUser } = useAuth()

  const [profile, setProfile] = useState(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const [activeTab, setActiveTab] = useState('home')


  const [announcements, setAnnouncements] = useState([])
  const [annLoading, setAnnLoading] = useState(false)

  const [paymentSettings, setPaymentSettings] = useState(null)
  const [paymentLoading, setPaymentLoading] = useState(false)

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

  const [originalForm, setOriginalForm] = useState(null)

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const previewUrlRef = useRef(null)

  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!user || loading) return

    let isMounted = true
    const fetchProfile = async () => {
      setProfileLoading(true)
      try {
        const res = await api.get('/members/')
        if (!isMounted) return

        // Support both response shapes:
        // - paginated: { results: [...] }
        // - non-paginated: [...]
        const items = Array.isArray(res.data)
          ? res.data
          : res.data?.results || []

        // Match robustly (user id may come as number/string)
        const meId = user?.id
        const found = items.find((p) => {
          const pUser = p?.user
          return (
            pUser === meId ||
            String(pUser) === String(meId)
          )
        })

        setProfile(found || null)
      } catch (err) {
        if (!isMounted) return
        toast.error(safeDetailFromError(err))
        setProfile(null)
      } finally {
        if (!isMounted) return
        setProfileLoading(false)
      }
    }

    fetchProfile()

    return () => {
      isMounted = false
    }
  }, [user?.id, loading])

  useEffect(() => {
    if (!profile) return

    let isMounted = true
    const fetchAnnouncements = async () => {
      setAnnLoading(true)
      try {
        const res = await api.get('/announcements/')
        if (!isMounted) return
        setAnnouncements(res.data?.results || [])
      } catch (err) {
        if (!isMounted) return
        setAnnouncements([])
      } finally {
        if (!isMounted) return
        setAnnLoading(false)
      }
    }

    fetchAnnouncements()

    return () => {
      isMounted = false
    }
  }, [profile])

  useEffect(() => {
    if (!profile) return

    let isMounted = true
    const fetchPayment = async () => {
      setPaymentLoading(true)
      try {
        const res = await api.get('/members/payment-settings/')
        if (!isMounted) return
        setPaymentSettings(res.data || null)
      } catch {
        if (!isMounted) return
        setPaymentSettings(null)
      } finally {
        if (!isMounted) return
        setPaymentLoading(false)
      }
    }

    fetchPayment()

    return () => {
      isMounted = false
    }
  }, [profile])

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }, [])

  const memberFirstName = profile?.first_name || ''

  const canRender = !!user && !loading

  const onLogout = () => {

    logout()
    navigate('/login')
  }

  const enterEditMode = () => {
    if (!profile) return
    setEditMode(true)

    const next = {
      first_name: profile.first_name || '',
      middle_name: profile.middle_name || '',
      last_name: profile.last_name || '',
      contact_number: profile.contact_number || '',
      year_level: profile.year_level ?? '',
      section: profile.section || '',
      address: profile.address || '',
      birthdate: profile.birthdate ? String(profile.birthdate).slice(0, 10) : '',
    }

    setEditForm(next)
    setOriginalForm(next)

    setSelectedFile(null)
    setPreviewUrl(null)
  }

  const revokePreviewIfAny = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
  }

  const cancelEdit = () => {
    if (editSaving) return
    revokePreviewIfAny()

    setEditMode(false)
    setEditSaving(false)
    setSelectedFile(null)
    setPreviewUrl(null)

    if (originalForm) setEditForm(originalForm)
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
      toast.error('Profile picture must be an image file (image/*).')
      return
    }

    revokePreviewIfAny()

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
    let isMounted = true

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

      // Omit birthdate when empty; prevents backend 400s from invalid/empty payloads.
      if (editForm.birthdate) {
        patchBase.birthdate = editForm.birthdate
      }


      if (selectedFile) {
        const fd = new FormData()
        fd.append('first_name', patchBase.first_name)
        fd.append('middle_name', patchBase.middle_name)
        fd.append('last_name', patchBase.last_name)
        fd.append('contact_number', patchBase.contact_number)
        fd.append('year_level', patchBase.year_level)
        fd.append('section', patchBase.section)
        fd.append('address', patchBase.address)

        if (patchBase.birthdate) {
          fd.append('birthdate', patchBase.birthdate)
        }

        fd.append('profile_picture', selectedFile)


        await api.patch(`/members/${profile.id}/`, fd)
      } else {
        await api.patch(`/members/${profile.id}/`, patchBase)
      }

      await refreshUser()

      if (isMounted) {
        toast.success('Profile updated!')
        setEditMode(false)
        setEditSaving(false)
        setSelectedFile(null)
        revokePreviewIfAny()
        setPreviewUrl(null)
      }

      // Re-fetch profile after update
      const res = await api.get('/members/')
      if (isMounted) {
        const items = Array.isArray(res.data)
          ? res.data
          : res.data?.results || []

        const meId = user?.id
        const found = items.find((p) => {
          const pUser = p?.user
          return pUser === meId || String(pUser) === String(meId)
        })

        setProfile(found || null)
      }
    } catch (err) {
      if (!isMounted) return
      toast.error(safeDetailFromError(err))
    } finally {
      if (isMounted) setEditSaving(false)
    }

    return () => {
      isMounted = false
    }
  }

  const recentAnnouncements = useMemo(() => {
    const sorted = [...announcements].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
    )
    return sorted.slice(0, 3)
  }, [announcements])

  const paymentMethodLabel = useMemo(() => {
    if (!profile?.payment_method) return ''
    return profile.payment_method
  }, [profile?.payment_method])

  const annSoftError = ''


  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-slate-700">
          Unable to find your member profile.
        </div>
      </div>
    )
  }

  const avatarInitial = getInitials(profile.first_name)

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Welcome back, {memberFirstName}!</h1>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
                APPROVED Member
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">Membership</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{profile.membership_status}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">Year Level</p>
            <p className="mt-2 text-lg font-bold text-slate-900">
              {YEAR_LABEL_BY_VALUE[String(profile.year_level ?? '')] || profile.year_level || '—'}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">Course</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{profile.course || '—'}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">Member Since</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{formatMemberSince(profile.created_at)}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <button type="button" onClick={onAvatarClick} className="group">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600">
                    {profile.profile_picture ? (
                      <img
                        src={profile.profile_picture}
                        alt="Profile"
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold text-white">{avatarInitial}</span>
                    )}
                  </div>
                </button>

                {!editMode ? (
                  <button
                    type="button"
                    onClick={enterEditMode}
                    className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex flex-col items-end gap-2">
                    <button
                      type="button"
                      onClick={saveProfile}
                      disabled={editSaving}
                      className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {editSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={editSaving}
                      className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>
                )}

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
              </div>

              {editMode && previewUrl && (
                <div className="mt-3">
                  <div className="flex items-center justify-start">
                    <div className="text-xs font-semibold text-slate-500">Preview</div>
                  </div>
                  <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2">
                    <img src={previewUrl} alt="Preview" className="h-32 w-full rounded-lg object-cover" />
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-4">
                {!editMode ? (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-slate-600">Full Name</p>
                      <p className="mt-1 text-slate-900">
                        {[profile.first_name, profile.middle_name, profile.last_name]
                          .filter(Boolean)
                          .join(' ') || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">Email</p>
                      <p className="mt-1 text-slate-900">{user.email || '—'}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">Student Number</p>
                      <p className="mt-1 text-slate-900">{profile.student_number || '—'}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">Contact</p>
                      <p className="mt-1 text-slate-900">{profile.contact_number || '—'}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">Section</p>
                      <p className="mt-1 text-slate-900">{profile.section || '—'}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">Year Level</p>
                      <p className="mt-1 text-slate-900">
                        {YEAR_LABEL_BY_VALUE[String(profile.year_level ?? '')] || profile.year_level || '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">Address</p>
                      <p className="mt-1 text-slate-900">{profile.address || '—'}</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-600">Birthdate</p>
                      <p className="mt-1 text-slate-900">
                        {profile.birthdate ? String(profile.birthdate).slice(0, 10) : '—'}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-sm font-semibold text-slate-600">First Name</label>
                      <input
                        value={editForm.first_name}
                        onChange={(e) => onChangeEditField('first_name', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Middle Name</label>
                      <input
                        value={editForm.middle_name}
                        onChange={(e) => onChangeEditField('middle_name', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Last Name</label>
                      <input
                        value={editForm.last_name}
                        onChange={(e) => onChangeEditField('last_name', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Email</label>
                      <input
                        value={user.email || ''}
                        disabled
                        readOnly
                        className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Student Number</label>
                      <input
                        value={profile.student_number || ''}
                        disabled
                        readOnly
                        className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Contact Number</label>
                      <input
                        value={editForm.contact_number}
                        onChange={(e) => onChangeEditField('contact_number', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Course</label>
                      <input
                        value={profile.course || ''}
                        disabled
                        readOnly
                        className="mt-1 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Year Level</label>
                      <select
                        value={editForm.year_level}
                        onChange={(e) => onChangeEditField('year_level', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                      >
                        <option value="">Select year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Section</label>
                      <input
                        value={editForm.section}
                        onChange={(e) => onChangeEditField('section', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Address</label>
                      <input
                        value={editForm.address}
                        onChange={(e) => onChangeEditField('address', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-slate-600">Birthdate</label>
                      <input
                        type="date"
                        value={editForm.birthdate}
                        onChange={(e) => onChangeEditField('birthdate', e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-sky-400"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Recent Announcements */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">Recent Announcements</h2>
                {annLoading && (
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
                )}
              </div>

              {annSoftError ? (
                <p className="mt-4 text-sm text-slate-500">{annSoftError}</p>
              ) : null}

              <div className="mt-4 grid gap-4 sm:grid-cols-1">
                {annLoading && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Loading...
                  </div>
                )}

                {!annLoading && recentAnnouncements.length === 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No announcements found.
                  </div>
                )}

                {!annLoading &&
                  recentAnnouncements.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => navigate(`/announcement/${a.id}`)}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                            {a.category || 'announcement'}
                          </div>
                          <div className="mt-2 text-base font-semibold text-slate-900">{a.title}</div>
                          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{a.body}</p>
                        </div>
                        <div className="shrink-0 text-right text-xs text-slate-400">
                          {a.created_at ? String(new Date(a.created_at).toLocaleDateString()) : ''}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>

            {/* Payment */}
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-xl font-bold text-slate-900">Payment Info</h2>
                {paymentLoading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600" />
                ) : null}
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <div className="text-sm font-semibold text-slate-600">Payment Method</div>
                  <div className="mt-1 text-slate-900">
                    {paymentMethodLabel || '—'}
                    {profile.payment_method === 'GCASH' ? ':' : ''}
                  </div>
                </div>

                {profile.payment_method === 'GCASH' && (
                  <div>
                    <div className="text-sm font-semibold text-slate-600">GCASH Details</div>
                    <div className="mt-1 text-slate-900">
                      <div>{paymentSettings?.gcash_name || '—'}</div>
                      <div className="mt-1">{paymentSettings?.gcash_number || '—'}</div>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-sm font-semibold text-slate-600">Payment Proof</div>
                  {profile.payment_proof_image ? (
                    <img
                      src={profile.payment_proof_image}
                      alt="Payment proof"
                      className="mt-2 h-28 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 object-cover"
                      onClick={() => window.open(profile.payment_proof_image, '_blank')}
                    />
                  ) : (
                    <p className="mt-2 text-sm text-slate-500">No payment proof uploaded</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

