import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Landing from './pages/landing/Landing'

const Dashboard = () => <div className="min-h-screen bg-white p-8 text-slate-900">Member Dashboard - coming in Phase 4</div>
const AdminDashboard = () => <div className="min-h-screen bg-white p-8 text-slate-900">Admin Dashboard - coming in Phase 5</div>

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
