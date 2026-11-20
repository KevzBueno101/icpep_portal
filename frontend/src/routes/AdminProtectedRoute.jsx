import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import PageSkeleton from '../components/skeletons/PageSkeleton'

const AdminProtectedRoute = ({ children, requirePosition = null, requiresMembership = false }) => {
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

  // RESTRICTED admins cannot view member data — only Membership Access and
  // Full Control can. Presidents always retain access.
  if (
    requiresMembership &&
    user?.access_level === 'RESTRICTED' &&
    String(user.position || '').toLowerCase() !== 'president'
  ) {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

export default AdminProtectedRoute

