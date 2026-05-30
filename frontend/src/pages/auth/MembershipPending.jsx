import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/useAuth'

const MembershipPending = () => {
  const { user, loading, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [checking, setChecking] = useState(false)

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

  if (user.role === 'ADMIN') {
    return <Navigate to="/admin/dashboard" replace />
  }

  if (user.membership_status === 'APPROVED') {
    return <Navigate to="/dashboard" replace />
  }

  const handleRefresh = async () => {
    setChecking(true)
    try {
      const freshUser = await refreshUser()
      if (freshUser.membership_status === 'APPROVED') {
        toast.success('Your membership has been approved.')
        navigate('/dashboard', { replace: true })
      } else {
        toast('Your membership is still pending approval.')
      }
    } catch {
      toast.error('Unable to check approval status. Please try again.')
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-lg">
        <img src="/icpep_logo.png" alt="ICPEP.SE Logo" className="mx-auto h-16 w-auto" />
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">Membership Pending</p>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Please wait for verification and approval</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your registration has been received. An administrator will verify your submitted details and approve your membership before you can access the dashboard.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Current status: <span className="font-semibold">{user.membership_status || 'PENDING'}</span>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={checking}
            className="rounded-lg bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Check Status'}
          </button>
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
