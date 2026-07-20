import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import PageSkeleton from '../components/skeletons/PageSkeleton'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageSkeleton />
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

