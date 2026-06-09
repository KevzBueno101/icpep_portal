import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // SAFETY GUARD: Admin users must never access member-only routes.
  // Do not call logout() synchronously during render.
  if (user.role === 'ADMIN') {
    return <Navigate to="/login" replace />
  }


  if (user.membership_status !== 'APPROVED') {
    return <Navigate to="/membership-pending" replace />
  }

  return children
}

export default ProtectedRoute

