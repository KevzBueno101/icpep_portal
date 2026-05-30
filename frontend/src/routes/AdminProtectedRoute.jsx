import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const AdminProtectedRoute = ({ children, requirePosition = null }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/admin-portal/login" replace />
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />
  }

  if (requirePosition && user.position !== requirePosition && user.position !== 'PRESIDENT') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}

export default AdminProtectedRoute
