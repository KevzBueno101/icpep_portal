import { useState, useEffect, useRef } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/useAuth'

// How often to silently poll for approval status (in milliseconds)
const POLL_INTERVAL_MS = 8000 // every 8 seconds

const MembershipPending = () => {
  const { user, loading, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)
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
              ? 'Your membership request was not approved. Please contact an administrator for more details or register again.'
              : user.membership_status === 'EXPIRED'
              ? 'Your membership has expired. Please contact an administrator to renew.'
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
            Automatically checking for updates every 8 seconds...
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
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}

export default MembershipPending