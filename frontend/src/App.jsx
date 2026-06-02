import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminProtectedRoute from './routes/AdminProtectedRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import MembershipPending from './pages/auth/MembershipPending'
import AdminLogin from './pages/auth/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import Landing from './pages/landing/Landing'
import MilestoneDetail from './pages/landing/MilestoneDetail'
import AdminLayout from './layouts/AdminLayout'

import AdminMembership from './pages/admin/placeholder/AdminMembership'
import AdminAdmins from './pages/admin/placeholder/AdminAdmins'
import AdminAchievements from './pages/admin/AdminAchievements'
import AdminAnnouncement from './pages/admin/placeholder/AdminAnnouncement'
import AdminProfile from './pages/admin/placeholder/AdminProfile'
import AdminLogs from './pages/admin/placeholder/AdminLogs'
import AdminMembershipVerify from './pages/admin/AdminMembershipVerify'


// Placeholder — member dashboard still to be implemented
const Dashboard = () => <div className="p-8 text-white bg-gray-950 min-h-screen">Member Dashboard — Phase 4</div>

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{ style: { background: '#0f0f18', color: '#e5e7eb', border: '1px solid #1f2937' } }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/milestone/:id" element={<MilestoneDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/membership-pending" element={<MembershipPending />} />

          {/* Hidden admin login — no links point here */}
          <Route path="/admin-portal/login" element={<AdminLogin />} />

          {/* Member protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin protected routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/membership"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminMembership />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/membership/:id/verify"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminMembershipVerify />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/admins"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminAdmins />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/achievements"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminAchievements />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/announcement"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminAnnouncement />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminProfile />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <AdminLogs />
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          {/* Default admin landing */}
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
