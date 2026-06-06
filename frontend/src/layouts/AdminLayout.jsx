import { useState } from 'react'
import React from 'react'
import { useAuth } from '../context/useAuth'
import AdminSidebar from '../components/admin/AdminSidebar'
import api from '../api/axios'
import toast from 'react-hot-toast'

const AdminLayout = ({
  children,
  badges = {},
  quickActions = { enabled: true },
}) => {
  const { user, loading, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [yearEndBusy, setYearEndBusy] = useState(false)

  const handleYearEndReset = async () => {
    setYearEndBusy(true)
    try {
      const res = await api.post('/users/admins/year-end-reset/')
      toast.success(res.data.message || 'Year-end reset complete.')
      // Reload the page to refresh all data
      window.location.reload()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Year-end reset failed.')
    } finally {
      setYearEndBusy(false)
    }
  }

  // Clone children and pass Year-End reset props
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onYearEndReset: handleYearEndReset,
        yearEndBusy,
        isPresident: user?.position === 'PRESIDENT',
      })
    }
    return child
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <button
        type="button"
        className="lg:hidden fixed left-4 top-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-xl shadow-slate-950/20 ring-1 ring-white/10"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open admin navigation"
      >
        <span className="block h-5 w-5 relative">
          <span className="absolute left-0 top-1 h-0.5 w-5 bg-white" />
          <span className="absolute left-0 top-2.5 h-0.5 w-5 bg-white" />
          <span className="absolute left-0 top-4 h-0.5 w-5 bg-white" />
        </span>
      </button>

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-6">
        <div className="flex gap-4 xl:gap-5">
          <AdminSidebar
            mobileOpen={sidebarOpen}
            setMobileOpen={setSidebarOpen}
            badges={{
              pendingMembership: badges.pendingMembership ?? 0,
              newLogs: badges.newLogs ?? 0,
            }}
            quickActions={quickActions}
            logout={logout}
            onYearEndReset={handleYearEndReset}
            yearEndBusy={yearEndBusy}
            isPresident={user?.position === 'PRESIDENT'}
          />

          <div className="min-w-0 flex-1 lg:ml-56">
            <div className="pb-8">
              {childrenWithProps}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default AdminLayout
