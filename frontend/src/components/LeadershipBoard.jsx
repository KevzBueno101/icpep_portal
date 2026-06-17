import { useState } from 'react'
import { useOfficers } from '../context/OfficersContext'
import OfficerCard from './OfficerCard'
import OfficerSkeleton from './OfficerSkeleton'
import EmptyLeadershipState from './EmptyLeadershipState'

export default function LeadershipBoard() {
  const [error, setError] = useState(null)
  let officers = []
  let officersLoading = false
  let refreshOfficers = () => {}

  try {
    const value = useOfficers()
    officers = value.officers || []
    officersLoading = !!value.officersLoading
    refreshOfficers = value.refreshOfficers || (() => {})
  } catch (e) {
    console.error('[LeadershipBoard] OfficersContext unavailable:', e)
    setError('Unable to load leadership board. Please try again later.')
  }

  // Map old data structure to new structure if needed
  const mappedOfficers = officers.map(officer => {
    // Check if already in new format
    if (officer.fullName && officer.position) {
      return officer
    }
    // Convert old format to new format
    const fname = officer.first_name || officer.user?.first_name || ''
    const lname = officer.last_name || officer.user?.last_name || ''
    const fullName = `${fname} ${lname}`.trim() || officer.username || officer.user?.username || ''
    
    return {
      id: officer.user_id || officer.id,
      fullName,
      position: officer.position || '',
      office: officer.department || '',
      academicYear: officer.academic_year || '',
      username: officer.username || officer.user?.username || '',
      avatarUrl: officer.profile_picture || officer.photo || null,
      isActive: officer.is_active !== false,
    }
  })

  // Filter out invalid records
  const validOfficers = mappedOfficers.filter(
    officer => officer.isActive && officer.fullName && officer.fullName !== '-' && officer.position
  )

  const handleRetry = () => {
    setError(null)
    refreshOfficers()
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-dashed border-red-200 bg-red-50 p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-semibold text-red-900">Unable to Load Leadership Board</h3>
        <p className="mb-4 text-sm text-red-700">
          {error}
        </p>
        <button
          onClick={handleRetry}
          className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          <svg
            className="mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
            />
          </svg>
          Try Again
        </button>
      </div>
    )
  }

  if (officersLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <OfficerSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (validOfficers.length === 0) {
    return <EmptyLeadershipState />
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {validOfficers.map((officer) => (
        <OfficerCard key={officer.id} officer={officer} />
      ))}
    </div>
  )
}
