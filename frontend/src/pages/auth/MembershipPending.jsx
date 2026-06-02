import { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import { useAuth } from '../../context/useAuth'

// How often to silently poll for approval status (in milliseconds)
const POLL_INTERVAL_MS = 8000 // every 8 seconds

const MembershipPending = () => {
  const { user, loading, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
  const [showRenewModal, setShowRenewModal] = useState(false)
  const [yearLevel, setYearLevel] = useState(user?.year_level || '1')
  const [paymentProofFile, setPaymentProofFile] = useState(null)
  const [coeIdFile, setCoeIdFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [renewError, setRenewError] = useState(null)
  const intervalRef = useRef(null)

  // ✅ Auto-poll: silently check approval status every 8 seconds.
  // When the admin approves, this will catch it and redirect the member
  // to /dashboard automatically without them needing to click anything.
  useEffect(() => {
    // Only start polling if user is logged in, is a MEMBER, and is still PENDING
    if (!user || user.role === 'ADMIN' || user.membership_status === 'APPROVED') return

    const poll = async () => {
      try {
        const freshUser = await refreshUser()
        if (freshUser.membership_status === 'APPROVED') {
          toast.success('Your membership has been approved! Welcome!')
          // Clear the interval before navigating
          if (intervalRef.current) clearInterval(intervalRef.current)
          navigate('/dashboard', { replace: true })
        }
      } catch {
        // Silent fail — don't show errors for background polling
      }
    }

    // Start polling
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [user, refreshUser, navigate])

  // ─── Early returns (guards) ───────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-sky-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // SAFETY GUARD: If an admin token somehow loaded into this member session,
  // do not silently redirect. Log out and send to the correct login page.
  if (user.role === 'ADMIN') {
    // Do not call logout() synchronously during render.
    return <Navigate to="/login" replace />
  }



  // If member is already approved, redirect them to their dashboard
  if (user.membership_status === 'APPROVED') {
    return <Navigate to="/dashboard" replace />
  }

  // ─── Manual check handler ─────────────────────────────────────────────────

  const handleRefresh = async () => {
    setChecking(true)
    try {
      const freshUser = await refreshUser()
      if (freshUser.membership_status === 'APPROVED') {
        toast.success('Your membership has been approved! Welcome!')
        if (intervalRef.current) clearInterval(intervalRef.current)
        navigate('/dashboard', { replace: true })
      } else if (freshUser.membership_status === 'REJECTED') {
        toast.error('Your membership request was rejected. Please contact the admin.')
      } else {
        toast('Still pending — hang tight, an admin will review your request soon.')
      }
    } catch {
      toast.error('Unable to check approval status. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    logout()
    navigate('/login', { replace: true })
  }
  const closeRenewModal = () => {
    setShowRenewModal(false)
    setRenewError(null)
    setPaymentProofFile(null)
    setCoeIdFile(null)
  }

  const handleSubmitRenewal = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setRenewError(null)

    if (!paymentProofFile || !coeIdFile) {
      setRenewError('Please upload both payment proof and COE/ID document.')
      setSubmitting(false)
      return
    }

    const formData = new FormData()
    formData.append('year_level', yearLevel)
    formData.append('payment_proof_image', paymentProofFile)
    formData.append('coe_id_image', coeIdFile)

    try {
      await api.post('/members/renew/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      await refreshUser()
      toast.success('Renewal request submitted. Your membership is now pending review.')
      closeRenewModal()
    } catch (error) {
      const detail = error.response?.data?.detail || error.response?.data?.year_level?.[0] || error.response?.data?.payment_proof_image?.[0] || error.response?.data?.coe_id_image?.[0]
      setRenewError(detail || 'Unable to submit renewal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }
  // ─── Status display helpers ───────────────────────────────────────────────

  const statusConfig = {
    PENDING: {
      label: 'Pending Review',
      bg: 'bg-amber-50 border-amber-200',
      text: 'text-amber-800',
      dot: 'bg-amber-400',
    },
    REJECTED: {
      label: 'Rejected',
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
      dot: 'bg-red-500',
    },
    EXPIRED: {
      label: 'Expired',
      bg: 'bg-slate-100 border-slate-200',
      text: 'text-slate-700',
      dot: 'bg-slate-400',
    },
  }

  const currentStatus = statusConfig[user.membership_status] || statusConfig.PENDING

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">

        <img src="/icpep_logo.png" alt="ICPEP.SE Logo" className="mx-auto h-16 w-auto" />

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
            Membership Status
          </p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            {user.membership_status === 'REJECTED'
              ? 'Membership Request Rejected'
              : user.membership_status === 'EXPIRED'
              ? 'Membership Expired'
              : 'Waiting for Approval'}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {user.membership_status === 'REJECTED'
              ? 'Your membership request was not approved. You may submit a renewal request again with updated documentation, or contact an administrator for help.'
              : user.membership_status === 'EXPIRED'
              ? 'Your membership has expired. Please submit a renewal request using the button below so we can review your updated status and documents.'
              : 'Your registration has been received. An administrator will review your submitted details shortly. This page will automatically update when you are approved.'}
          </p>
        </div>

        {/* Status badge */}
        <div className={`mt-6 rounded-xl border px-4 py-3 ${currentStatus.bg}`}>
          <div className="flex items-center justify-center gap-2">
            <span className={`h-2 w-2 rounded-full ${currentStatus.dot} ${user.membership_status === 'PENDING' ? 'animate-pulse' : ''}`} />
            <span className={`text-sm font-semibold ${currentStatus.text}`}>
              {currentStatus.label}
            </span>
          </div>
        </div>

        {/* Auto-poll indicator — only show when PENDING */}
        {user.membership_status === 'PENDING' && (
          <p className="mt-3 text-xs text-slate-400">
            Please wait while we automatically check for approval.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {/* Only show manual check button when PENDING */}
          {user.membership_status === 'PENDING' && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={checking}
              className="rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {checking ? 'Checking...' : 'Check Now'}
            </button>
          )}

          {/* Show renew button for expired or rejected members */}
          {['EXPIRED', 'REJECTED'].includes(user.membership_status) && (
            <button
              type="button"
              onClick={() => setShowRenewModal(true)}
              className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Renew Membership
            </button>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign Out
          </button>
        </div>

        {showRenewModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4 py-8">
            <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Renew Your Membership</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Submit your current year level, payment proof, and COE/ID document.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRenewModal}
                  className="rounded-full bg-slate-100 p-2 text-slate-600 transition hover:bg-slate-200"
                >
                  ✕
                </button>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSubmitRenewal}>
                <div>
                  <label htmlFor="year_level" className="block text-sm font-semibold text-slate-700">
                    Year Level
                  </label>
                  <select
                    id="year_level"
                    value={yearLevel}
                    onChange={(e) => setYearLevel(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    Payment Proof
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPaymentProofFile(e.target.files?.[0] || null)}
                    className="mt-2 w-full text-sm text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700">
                    COE / ID Document
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoeIdFile(e.target.files?.[0] || null)}
                    className="mt-2 w-full text-sm text-slate-700"
                  />
                </div>

                {renewError && (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {renewError}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeRenewModal}
                    className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Renewal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MembershipPending