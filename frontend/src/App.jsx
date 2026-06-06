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
import AnnouncementDetail from './pages/landing/AnnouncementDetail'
import AdminLayout from './layouts/AdminLayout'

import AdminMembership from './pages/admin/placeholder/AdminMembership'
import AdminAdmins from './pages/admin/placeholder/AdminAdmins'
import AdminAchievements from './pages/admin/AdminAchievements'
import AdminAnnouncement from './pages/admin/placeholder/AdminAnnouncement'
import AdminProfile from './pages/admin/AdminProfile'
import EditAdminProfile from './pages/admin/EditAdminProfile'

import AdminLogs from './pages/admin/placeholder/AdminLogs'
import AdminMembershipVerify from './pages/admin/AdminMembershipVerify'


import { MemberProvider } from './context/MemberContext'
import MemberLayout from './layouts/MemberLayout'
import MemberDashboard from './pages/member/MemberDashboard'
import MemberAnnouncements from './pages/member/MemberAnnouncements'
import MemberIdCard from './pages/member/MemberIdCard'
import MemberAbout from './pages/member/MemberAbout'
import MemberProfile from './pages/member/MemberProfile'

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
          <Route path="/announcement/:id" element={<AnnouncementDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/membership-pending" element={<MembershipPending />} />

          {/* Hidden admin login — no links point here */}
          <Route path="/admin-portal/login" element={<AdminLogin />} />

          {/* Member protected routes */}
          <Route
            path="/member/dashboard"
            element={
              <ProtectedRoute>
                <MemberProvider>
                  <MemberLayout>
                    <MemberDashboard />
                  </MemberLayout>
                </MemberProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/announcements"
            element={
              <ProtectedRoute>
                <MemberProvider>
                  <MemberLayout>
                    <MemberAnnouncements />
                  </MemberLayout>
                </MemberProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/id"
            element={
              <ProtectedRoute>
                <MemberProvider>
                  <MemberLayout>
                    <MemberIdCard />
                  </MemberLayout>
                </MemberProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/about"
            element={
              <ProtectedRoute>
                <MemberProvider>
                  <MemberLayout>
                    <MemberAbout />
                  </MemberLayout>
                </MemberProvider>
              </ProtectedRoute>
            }
          />
          <Route
            path="/member/profile"
            element={
              <ProtectedRoute>
                <MemberProvider>
                  <MemberLayout>
                    <MemberProfile />
                  </MemberLayout>
                </MemberProvider>
              </ProtectedRoute>
            }
          />

          {/* Backward-compat: legacy member dashboard */}
          <Route path="/dashboard" element={<Navigate to="/member/dashboard" replace />} />



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
            path="/admin/edit-profile"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <EditAdminProfile />
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
