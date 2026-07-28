import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import PageSkeleton from '../components/skeletons/PageSkeleton'

const AdminProtectedRoute = ({ children, requirePosition = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <PageSkeleton />
  }

  if (!user) {
    return <Navigate to="/admin-portal/login" replace />
  }

  // SAFETY GUARD: Regular members must never access admin routes.
  // Do not call logout() synchronously during render.
  const isAdminRole = user.role === 'ADMIN'
  const isOfficerPresident = user.role === 'OFFICER' && String(user.position || '').toLowerCase().includes('president')
  if (!isAdminRole && !isOfficerPresident) {
    return <Navigate to="/login" replace />
  }


  if (
    requirePosition &&
    user.position !== requirePosition &&
    user.position !== 'PRESIDENT'
  ) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

export default AdminProtectedRoute

