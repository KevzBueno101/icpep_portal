import { useState, useEffect } from 'react'
import React from 'react'
import { useAuth } from '../context/useAuth'
import AdminSidebar from '../components/admin/AdminSidebar'
import api from '../api/axios'
import PageSkeleton from '../components/skeletons/PageSkeleton'

const AdminLayout = ({ children, badges = {} }) => {
  const { user, loading, logout } = useAuth()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [newLogsBadge, setNewLogsBadge] = useState(0)
  const isRestricted = user?.access_level === 'RESTRICTED'

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  useEffect(() => {
    const fetchLogsStats = async () => {
      if (!user) return

      try {
        const lastVisit = localStorage.getItem('lastLogsVisit')
        const params = lastVisit ? { last_visit: lastVisit } : {}
        const res = await api.get('/audit-logs/stats/', { params })
        setNewLogsBadge(res.data.new_logs || 0)
      } catch (err) {
        console.error('Failed to fetch logs stats:', err)
      }
    }

    fetchLogsStats()
  }, [user, refreshTrigger])

  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        refreshTrigger,
        triggerRefresh,
      })
    }
    return child
  })

  if (loading) {
    return <PageSkeleton />
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {isRestricted && (
        <div className="fixed right-0 top-0 z-[60] px-3 py-1 text-[10px] font-medium text-slate-400 opacity-20">
          Restricted Account — Read Only
        </div>
      )}

      <AdminSidebar
        badges={{
          pendingMembership: badges.pendingMembership ?? 0,
          newLogs: newLogsBadge,
        }}
        logout={logout}
      />

      <main className="mx-auto max-w-[1440px] px-4 pb-6 pt-14 sm:px-6 lg:px-6">
        <div className="pb-8">{childrenWithProps}</div>
      </main>
    </div>
  )
}

export default AdminLayout
