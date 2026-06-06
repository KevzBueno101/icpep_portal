import { useEffect, useState } from 'react'
import api from '../../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../../../components/common/ConfirmModal'

const ACTION_TYPE_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'MEMBER_APPROVED', label: 'Member Approved' },
  { value: 'MEMBER_REJECTED', label: 'Member Rejected' },
  { value: 'MEMBER_CREATED', label: 'Member Created' },
  { value: 'MEMBER_UPDATED', label: 'Member Updated' },
  { value: 'MEMBER_DELETED', label: 'Member Deleted' },
  { value: 'ROLE_ASSIGNED', label: 'Role Assigned' },
  { value: 'ROLE_DELEGATED', label: 'Role Delegated' },
  { value: 'ADMIN_CREATED', label: 'Admin Created' },
  { value: 'ADMIN_UPDATED', label: 'Admin Updated' },
  { value: 'ADMIN_DELETED', label: 'Admin Deleted' },
  { value: 'MILESTONE_CREATED', label: 'Milestone Created' },
  { value: 'MILESTONE_UPDATED', label: 'Milestone Updated' },
  { value: 'MILESTONE_DELETED', label: 'Milestone Deleted' },
  { value: 'ANNOUNCEMENT_CREATED', label: 'Announcement Created' },
  { value: 'ANNOUNCEMENT_UPDATED', label: 'Announcement Updated' },
  { value: 'ANNOUNCEMENT_DELETED', label: 'Announcement Deleted' },
  { value: 'YEAR_END_RESET', label: 'Year-End Reset' },
  { value: 'PAYMENT_SETTINGS_UPDATED', label: 'Payment Settings Updated' },
]

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All Entities' },
  { value: 'Member', label: 'Member' },
  { value: 'User', label: 'User' },
  { value: 'Milestone', label: 'Milestone' },
  { value: 'Announcement', label: 'Announcement' },
  { value: 'PaymentSettings', label: 'Payment Settings' },
]

const getActionBadgeColor = (actionType) => {
  if (actionType.includes('APPROVED') || actionType === 'ADMIN_CREATED') return 'bg-green-100 text-green-700'
  if (actionType.includes('REJECTED') || actionType.includes('DELETED')) return 'bg-red-100 text-red-700'
  if (actionType.includes('CREATED')) return 'bg-blue-100 text-blue-700'
  if (actionType.includes('UPDATED')) return 'bg-amber-100 text-amber-700'
  if (actionType === 'YEAR_END_RESET') return 'bg-purple-100 text-purple-700'
  return 'bg-slate-100 text-slate-700'
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const AdminLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const itemsPerPage = 25

  const [filters, setFilters] = useState({
    action_type: '',
    entity_type: '',
    date_from: '',
    date_to: '',
    search: '',
  })

  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false)
  const [cleanupBusy, setCleanupBusy] = useState(false)

  useEffect(() => {
    fetchLogs()
    // Save last visit timestamp
    localStorage.setItem('lastLogsVisit', new Date().toISOString())
  }, [currentPage, filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {
        page: currentPage,
        ...filters,
      }
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key]
      })

      const res = await api.get('/audit-logs/', { params })
      setLogs(res.data.results || res.data)
      setTotalLogs(res.data.count || res.data.length)
    } catch (err) {
      toast.error('Failed to load audit logs.')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleExport = async () => {
    try {
      const params = { ...filters }
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key]
      })

      const res = await api.get('/audit-logs/export/', {
        params,
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'audit_logs.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      toast.success('Logs exported successfully.')
    } catch (err) {
      toast.error('Failed to export logs.')
    }
  }

  const handleCleanup = async () => {
    setCleanupBusy(true)
    try {
      const res = await api.post('/audit-logs/cleanup/')
      toast.success(res.data.message)
      fetchLogs()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cleanup logs.')
    } finally {
      setCleanupBusy(false)
      setCleanupConfirmOpen(false)
    }
  }

  const totalPages = Math.ceil(totalLogs / itemsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Logs / Audit Trails</h2>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setCleanupConfirmOpen(true)}
            className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Cleanup Old Logs
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search logs..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:w-64"
          />
          <select
            value={filters.action_type}
            onChange={(e) => handleFilterChange('action_type', e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:w-48"
          >
            {ACTION_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filters.entity_type}
            onChange={(e) => handleFilterChange('entity_type', e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:w-48"
          >
            {ENTITY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-3">
          <input
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:w-40"
          />
          <input
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:w-40"
          />
        </div>
      </div>

      <div className="text-sm text-slate-500">
        Showing {logs.length} of {totalLogs} logs
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No audit logs found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Entity</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900">{formatDate(log.timestamp)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="font-medium text-slate-900">{log.admin_username || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">{log.admin_email || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getActionBadgeColor(log.action_type)}`}>
                        {log.action_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="font-medium text-slate-900">{log.entity_name || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{log.entity_display}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-slate-500">
                          {Object.entries(log.details).slice(0, 2).map(([key, value]) => (
                            <div key={key}>{key}: {String(value).substring(0, 30)}</div>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`h-10 w-10 rounded-full text-sm font-semibold ${
                  currentPage === page
                    ? 'bg-sky-600 text-white'
                    : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={cleanupConfirmOpen}
        variant="caution"
        title="Cleanup Old Logs?"
        description="This will permanently delete all audit logs older than 90 days. This action cannot be undone."
        confirmText="Cleanup"
        cancelText="Cancel"
        busy={cleanupBusy}
        onConfirm={handleCleanup}
        onCancel={() => setCleanupConfirmOpen(false)}
      />
    </div>
  )
}

export default AdminLogs


