import { useState, useMemo, useEffect } from 'react'
import { ChevronDown, Search, FileDown, Plus, CheckCircle, XCircle, Archive, AlertCircle, RefreshCw, X, PencilLine, Trash2 } from 'lucide-react'

import api from '../../../api/axios'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import ConfirmModal from '../../../components/common/ConfirmModal'

const AdminMembership = () => {


  const [members, setMembers] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [yearFilter, setYearFilter] = useState('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedMemberId, setExpandedMemberId] = useState(null)

  // Edit Member Modal State
  const [editTarget, setEditTarget] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)

  // Delete Member State
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const itemsPerPage = 10


  const navigate = useNavigate()


  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    user_email: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    student_number: '',
    course: 'Computer Engineering',
    year_level: '1',
    section: '',
    contact_number: '',
    birthdate: '',
    membership_status: 'PENDING',
  })

  // Fetch members from Django REST API
  const fetchMembers = async () => {
    try {
      setLoading(true)
      const response = await api.get('/members/')
      setMembers(response.data)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch members:', err)
      setError('Failed to fetch membership records. Please try again.')
      toast.error('Error fetching members')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    ;(async () => {
      await fetchMembers()
    })()
  }, [])


  const toggleMobileCard = (memberId) => {
    setExpandedMemberId((current) => (current === memberId ? null : memberId))
  }

  // Calculate statistics from active database records
  const stats = useMemo(() => {
    return {
      total: members.length,
      pending: members.filter((m) => m.membership_status === 'PENDING').length,
      approved: members.filter((m) => m.membership_status === 'APPROVED').length,
      expired: members.filter((m) => m.membership_status === 'EXPIRED').length,
    }
  }, [members])

  // Filter members based on search and selected values
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const fullName = `${member.first_name || ''} ${member.last_name || ''}`.toLowerCase()
      const email = (member.user_email || '').toLowerCase()
      const studentId = (member.student_number || '').toLowerCase()
      const search = searchTerm.toLowerCase()

      const matchesSearch =
        fullName.includes(search) ||
        email.includes(search) ||
        studentId.includes(search)

      const matchesStatus = statusFilter === 'ALL' || member.membership_status === statusFilter
      const matchesYear = yearFilter === 'ALL' || member.year_level === yearFilter

      return matchesSearch && matchesStatus && matchesYear
    })
  }, [members, searchTerm, statusFilter, yearFilter])

  // Pagination
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage)
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)


  // Status badge styling
  const getStatusStyles = (status) => {
    const styles = {
      PENDING: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      APPROVED: 'bg-green-50 text-green-700 border border-green-200',
      REJECTED: 'bg-red-50 text-red-700 border border-red-200',
      EXPIRED: 'bg-slate-100 text-slate-600 border border-slate-300',
    }
    return styles[status] || styles.PENDING
  }

  // Format year level from backend Choices value
  const formatYearLevel = (level) => {
    const mapping = {
      '1': '1st Year',
      '2': '2nd Year',
      '3': '3rd Year',
      '4': '4th Year',
    }
    return mapping[level] || `${level} Year`
  }



  const getMemberName = (member) =>
    `${member?.first_name || ''} ${member?.middle_name || ''} ${member?.last_name || ''}`.replace(/\s+/g, ' ').trim()



  // Handle member state approval/rejection/expiration
  const handleUpdateStatus = async (id, newStatus) => {

    try {
      const response = await api.post(`/members/${id}/approve/`, {
        membership_status: newStatus
      })
      toast.success(`Member status updated to ${newStatus}`)
      // Update local state
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? response.data : m))
      )
    } catch (err) {
      console.error('Failed to update member status:', err)
      toast.error('Failed to update member status.')
    }
  }

  const handleOpenEditModal = (member) => {
    setEditTarget(member)
    setEditForm({
      first_name: member.first_name || '',
      middle_name: member.middle_name || '',
      last_name: member.last_name || '',
      student_number: member.student_number || '',
      course: member.course || '',
      year_level: member.year_level || '1',
      section: member.section || '',
      contact_number: member.contact_number || '',
      membership_status: member.membership_status || 'PENDING',
    })
  }

  const handleEditFormChange = (e) => {
    const { name, value } = e.target
    setEditForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    if (!editTarget) return
    setIsEditSubmitting(true)
    try {
      const response = await api.patch(`/members/${editTarget.id}/`, editForm)
      setMembers((prev) => prev.map((m) => (m.id === editTarget.id ? response.data : m)))
      toast.success('Member updated successfully.')
      setEditTarget(null)
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        const firstKey = Object.keys(errors)[0]
        const rawErr = errors[firstKey]
        const errorMsg = Array.isArray(rawErr) ? rawErr[0] : rawErr
        toast.error(`${firstKey.replace('_', ' ')}: ${errorMsg}`)
      } else {
        toast.error('Failed to update member.')
      }
    } finally {
      setIsEditSubmitting(false)
    }
  }

  const handleDeleteMember = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const response = await api.post(`/members/${deleteTarget.id}/approve/`, {
        membership_status: 'EXPIRED',
      })
      setMembers((prev) => prev.map((m) => (m.id === deleteTarget.id ? response.data : m)))
      toast.success(
        `${deleteTarget.first_name} ${deleteTarget.last_name}'s membership has been removed.`
      )
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete member.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Add Member form open/change/submit handlers
  const handleOpenAddModal = () => {

    setFormData({
      user_email: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      student_number: '',
      course: 'Computer Engineering',
      year_level: '1',
      section: '',
      contact_number: '',
      birthdate: '',
      membership_status: 'PENDING',
    })
    setIsAddModalOpen(true)
  }

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()

    // Required fields client validation
    const requiredFields = [
      'user_email',
      'first_name',
      'last_name',
      'student_number',
      'course',
      'year_level',
      'section',
      'contact_number'
    ]

    const emptyFields = requiredFields.filter((field) => !formData[field]?.trim())
    if (emptyFields.length > 0) {
      toast.error('Please fill in all required fields.')
      return
    }

    try {
      setIsSubmitting(true)
      const payload = { ...formData }
      
      // Clean up optional fields before payload dispatch
      if (!payload.middle_name.trim()) delete payload.middle_name
      if (!payload.birthdate) delete payload.birthdate

      const response = await api.post('/members/', payload)
      
      // Prepend newly added member into local records dynamically
      setMembers((prev) => [response.data, ...prev])
      toast.success('Member created successfully!')
      setIsAddModalOpen(false)
    } catch (err) {
      console.error('Failed to create member:', err)
      const errors = err.response?.data
      if (errors) {
        const firstKey = Object.keys(errors)[0]
        const rawErr = errors[firstKey]
        const errorMsg = Array.isArray(rawErr) ? rawErr[0] : rawErr
        toast.error(`${firstKey.replace('_', ' ')}: ${errorMsg}`)
      } else {
        toast.error('Failed to create member. Make sure fields are valid.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Export filtered members to CSV
  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      toast.error('No member records match active filters to export.')
      return
    }

    const headers = [
      'Student ID',
      'Name',
      'Email',
      'Year',
      'Department / Course',
      'Status',
      'Joined Date'
    ]

    const rows = filteredMembers.map((member) => {
      const name = `${member.first_name || ''} ${member.last_name || ''}`.replace(/"/g, '""')
      const email = (member.user_email || '').replace(/"/g, '""')
      const studentNum = (member.student_number || '').replace(/"/g, '""')
      const year = formatYearLevel(member.year_level)
      const dept = (member.course || '').replace(/"/g, '""')
      const status = member.membership_status
      const joined = member.created_at
        ? new Date(member.created_at).toLocaleDateString('en-US')
        : 'N/A'

      return [
        `"${studentNum}"`,
        `"${name}"`,
        `"${email}"`,
        `"${year}"`,
        `"${dept}"`,
        `"${status}"`,
        `"${joined}"`
      ]
    })

    const csvContent = '\ufeff' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'icpep-membership-export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success(`Successfully exported ${filteredMembers.length} records to CSV!`)
  }

  if (loading && members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-600 border-r-2" />
        <p className="text-sm text-slate-500 font-medium animate-pulse">Loading members database...</p>
      </div>
    )
  }

  if (error && members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center space-y-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div>
          <h3 className="text-base font-semibold text-slate-950">Failed to Load Database</h3>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
        <button
          onClick={fetchMembers}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Admin</span>
          <span>→</span>
          <span className="text-slate-900 font-medium">Membership</span>
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">Membership Management</h1>
        <p className="text-sm text-slate-500">Manage student memberships, approvals, and credentials for ICPEP.SE</p>
      </div>

      {/* Analytics Cards Section */}
      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Members Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Total Members</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="mt-1 text-xs text-slate-500">All registered profiles</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-100">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m4 0v4m0-4v-4m6 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Pending Applications Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Pending</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.pending}</p>
              <p className="mt-1 text-xs text-slate-500">Awaiting approval</p>
            </div>
            <div className="p-2 rounded-lg bg-yellow-100">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Approved Members Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Approved</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.approved}</p>
              <p className="mt-1 text-xs text-slate-500">Active status members</p>
            </div>
            <div className="p-2 rounded-lg bg-green-100">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Expired Members Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-600 uppercase font-semibold tracking-wide">Expired / Inactive</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{stats.expired}</p>
              <p className="mt-1 text-xs text-slate-500">Expired profiles</p>
            </div>
            <div className="p-2 rounded-lg bg-slate-100">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="space-y-4">
          {/* Search and Primary Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
              >
                <FileDown className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handleOpenAddModal}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-2">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Filter:</p>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
            </select>

            {/* Year Level Filter */}
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="ALL">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>

            {/* Results Counter */}
            <div className="sm:ml-auto">
              <p className="text-xs text-slate-600">
                {filteredMembers.length} result{filteredMembers.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Members Table Section */}
      <div className="space-y-4">
        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {paginatedMembers.length > 0 ? (
            paginatedMembers.map((member) => {
              const isExpanded = expandedMemberId === member.id
              const memberName = `${member.first_name || ''} ${member.last_name || ''}`
              return (
                <article
                  key={member.id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => toggleMobileCard(member.id)}
                    className="w-full text-left"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                          {member.profile_picture ? (
                            <img
                              src={member.profile_picture}
                              alt={memberName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          ) : (
                            <span className="text-sm font-semibold text-blue-700">{memberName.trim().charAt(0) || '?'}</span>
                          )}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-slate-900">{memberName}</p>
                          <p className="text-xs text-slate-500">{member.student_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyles(member.membership_status)}`}>
                          {member.membership_status}
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
                      <div className="grid gap-2 text-sm text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">Email</span>
                          <span className="font-mono text-xs">{member.user_email || 'No email'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">Year</span>
                          <span>{formatYearLevel(member.year_level)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-700">Department</span>
                          <span>{member.course || 'Unassigned'}</span>
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <div className="grid gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/membership/${member.id}/verify`)}
                            className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-700 transition"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <CheckCircle className="w-4 h-4" />
                              Verify
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(member)}
                            className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <PencilLine className="w-4 h-4" />
                              Edit
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(member)}
                            className="w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 transition"
                          >
                            <span className="flex items-center justify-center gap-2">
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </article>
              )
            })
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              <p className="text-sm">No members found</p>
            </div>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full table-auto text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 text-[11px] uppercase tracking-wider">Student ID</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 text-[11px] uppercase tracking-wider">Name</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 text-[11px] uppercase tracking-wider">Year</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 text-[11px] uppercase tracking-wider">Department</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 text-[11px] uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-left font-semibold text-slate-700 text-[11px] uppercase tracking-wider">Joined</th>
                <th className="px-3 py-3 text-right font-semibold text-slate-700 text-[11px] uppercase tracking-wider w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMembers.length > 0 ? (
                paginatedMembers.map((member, idx) => {
                  const memberName = `${member.first_name || ''} ${member.last_name || ''}`
                  return (
                    <tr
                      key={member.id}
                      className={`group border-b border-slate-100 bg-white hover:bg-slate-50 transition duration-150 ${idx === paginatedMembers.length - 1 ? 'border-0' : ''}`}
                    >
                      <td className="px-3 py-3 text-slate-900 font-mono text-[11px] font-semibold">{member.student_number}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {member.profile_picture ? (
                              <img
                                src={member.profile_picture}
                                alt={memberName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-blue-700">
                                {memberName.trim().charAt(0) || '?'}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col">
                            <span className="text-slate-900 font-medium text-[12px] whitespace-nowrap">{memberName}</span>
                            <span className="text-[10px] text-slate-400 font-mono leading-none mt-0.5">{member.user_email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600 text-[11px]">{formatYearLevel(member.year_level)}</td>
                      <td className="px-3 py-3 text-slate-600 text-[11px]">{member.course || 'Unassigned'}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-semibold rounded-full border ${getStatusStyles(member.membership_status)}`}>
                          {member.membership_status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-600 text-[11px] whitespace-nowrap">
                        {member.created_at ? new Date(member.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }) : 'N/A'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          {/* Actions column (always show correct set) */}
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/membership/${member.id}/verify`)}
                            className="rounded-full bg-sky-50 p-1.5 text-sky-700 hover:bg-sky-100 border border-sky-200 transition"
                            title="Verify"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(member)}
                            className="rounded-full bg-amber-50 p-1.5 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                            title="Edit"
                          >
                            <PencilLine className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(member)}
                            className="rounded-full bg-red-50 p-1.5 text-red-700 hover:bg-red-100 border border-red-200 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="7" className="px-3 py-6 text-center text-slate-500">
                    <p className="text-[12px]">No members found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredMembers.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl">
            <p className="text-[11px] text-slate-600">
              Showing <span className="font-semibold">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold">{Math.min(currentPage * itemsPerPage, filteredMembers.length)}</span> of{' '}
              <span className="font-semibold">{filteredMembers.length}</span> results
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 text-[11px] border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg transition ${
                    page === currentPage
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'border border-slate-300 text-slate-700 bg-white hover:bg-slate-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 text-[11px] border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">

          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-950 font-display">Register New Member</h2>
                <p className="text-xs text-slate-500 mt-0.5">Manually provision a student user and matching profile.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Account Information Section */}
              <div>
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Account Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* User Email */}
                  <div>
                    <label htmlFor="user_email" className="block text-xs font-semibold text-slate-700 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="user_email"
                      name="user_email"
                      required
                      value={formData.user_email}
                      onChange={handleFormChange}
                      placeholder="student@domain.com"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50"
                    />
                  </div>

                  {/* Student ID */}
                  <div>
                    <label htmlFor="student_number" className="block text-xs font-semibold text-slate-700 mb-1">
                      Student Number / ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="student_number"
                      name="student_number"
                      required
                      value={formData.student_number}
                      onChange={handleFormChange}
                      placeholder="ICPEP-2026-XXXX"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Personal Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* First Name */}
                  <div>
                    <label htmlFor="first_name" className="block text-xs font-semibold text-slate-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      name="first_name"
                      required
                      value={formData.first_name}
                      onChange={handleFormChange}
                      placeholder="Juan"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50"
                    />
                  </div>

                  {/* Middle Name */}
                  <div>
                    <label htmlFor="middle_name" className="block text-xs font-semibold text-slate-700 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      id="middle_name"
                      name="middle_name"
                      value={formData.middle_name}
                      onChange={handleFormChange}
                      placeholder="Santos"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50"
                    />
                  </div>

                  {/* Last Name */}
                  <div>
                    <label htmlFor="last_name" className="block text-xs font-semibold text-slate-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      name="last_name"
                      required
                      value={formData.last_name}
                      onChange={handleFormChange}
                      placeholder="Dela Cruz"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Departmental & University Details */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">University / College Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Department / Course (UNEDITABLE / FIXED) */}
                  <div className="sm:col-span-1">
                    <label htmlFor="course" className="block text-xs font-semibold text-slate-700 mb-1">
                      Course / Department <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="course"
                      name="course"
                      readOnly
                      value={formData.course}
                      placeholder="Computer Engineering"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none transition bg-slate-100 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>

                  {/* Year Level */}
                  <div>
                    <label htmlFor="year_level" className="block text-xs font-semibold text-slate-700 mb-1">
                      Year Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="year_level"
                      name="year_level"
                      required
                      value={formData.year_level}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50 cursor-pointer"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>

                  {/* Section */}
                  <div>
                    <label htmlFor="section" className="block text-xs font-semibold text-slate-700 mb-1">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="section"
                      name="section"
                      required
                      value={formData.section}
                      onChange={handleFormChange}
                      placeholder="4A"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              {/* Extra Details */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Extra Profile Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Contact Number */}
                  <div className="sm:col-span-1">
                    <label htmlFor="contact_number" className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="contact_number"
                      name="contact_number"
                      required
                      value={formData.contact_number}
                      onChange={handleFormChange}
                      placeholder="09XXXXXXXXX"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50"
                    />
                  </div>

                  {/* Birthdate */}
                  <div>
                    <label htmlFor="birthdate" className="block text-xs font-semibold text-slate-700 mb-1">
                      Birthdate
                    </label>
                    <input
                      type="date"
                      id="birthdate"
                      name="birthdate"
                      value={formData.birthdate}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50 cursor-pointer"
                    />
                  </div>

                  {/* Membership Status */}
                  <div>
                    <label htmlFor="membership_status" className="block text-xs font-semibold text-slate-700 mb-1">
                      Initial Status
                    </label>
                    <select
                      id="membership_status"
                      name="membership_status"
                      value={formData.membership_status}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-slate-50 cursor-pointer"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Password notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex gap-2">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  <strong>Notice:</strong> Manually added members are automatically initialized with role <strong>MEMBER</strong> and a default temporary password of <strong>Changeme123!</strong>. They can log in immediately to complete their profile.
                </p>
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-70 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-white" />
                      Creating...
                    </>
                  ) : (
                    'Add Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-950">Edit Member</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Editing: {editTarget.first_name} {editTarget.last_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Name Fields */}
              <div>
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Name</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      required
                      value={editForm.first_name}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                    <input
                      type="text"
                      name="middle_name"
                      value={editForm.middle_name}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      required
                      value={editForm.last_name}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Academic Fields */}
              <div className="border-t border-slate-100 pt-4">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Academic Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Student Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="student_number"
                      required
                      value={editForm.student_number}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Course</label>
                    <input
                      type="text"
                      name="course"
                      value={editForm.course}
                      readOnly
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Year Level <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="year_level"
                      required
                      value={editForm.year_level}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Section <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="section"
                      required
                      value={editForm.section}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contact_number"
                      required
                      value={editForm.contact_number}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Membership Status</label>
                    <select
                      name="membership_status"
                      value={editForm.membership_status}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="APPROVED">Approved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="EXPIRED">Expired</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-2 justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  disabled={isEditSubmitting}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 transition disabled:opacity-70 flex items-center gap-2"
                >
                  {isEditSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-t-2 border-white" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        variant="caution"
        title="Delete member?"
        description={
          deleteTarget
            ? `This will remove ${deleteTarget.first_name} ${deleteTarget.last_name} (${deleteTarget.student_number}) from the membership list. This action cannot be undone.`
            : ''
        }
        confirmText="Delete"
        cancelText="Cancel"
        busy={isDeleting}
        onConfirm={handleDeleteMember}
        onCancel={() => setDeleteTarget(null)}
      />

    </div>
  )
}

export default AdminMembership

