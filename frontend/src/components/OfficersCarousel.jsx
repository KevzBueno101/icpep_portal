import { useState, useRef, useEffect } from 'react'
import { useOfficers } from '../context/OfficersContext'
import OfficerCard from './OfficerCard'
import OfficerSkeleton from './OfficerSkeleton'
import EmptyLeadershipState from './EmptyLeadershipState'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function OfficersCarousel() {
  const [error, setError] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  let officers = []
  let officersLoading = false
  let refreshOfficers = () => {}

  try {
    const value = useOfficers()
    officers = value.officers || []
    officersLoading = !!value.officersLoading
    refreshOfficers = value.refreshOfficers || (() => {})
  } catch (e) {
    console.error('[OfficersCarousel] OfficersContext unavailable:', e)
    setError('Unable to load leadership board. Please try again later.')
  }

  // Map old data structure to new structure if needed
  const mappedOfficers = officers.map(officer => {
    // Check if already in new format
    if (officer.fullName && officer.position) {
      // Resolve avatar URL for new format too
      let avatarUrl = officer.avatarUrl || null
      if (avatarUrl && !avatarUrl.startsWith('http')) {
        avatarUrl = `http://127.0.0.1:8000${avatarUrl}`
      }
      return { ...officer, avatarUrl }
    }
    // Convert old format to new format
    const fname = officer.first_name || officer.user?.first_name || ''
    const lname = officer.last_name || officer.user?.last_name || ''
    const fullName = `${fname} ${lname}`.trim() || officer.username || officer.user?.username || ''
    
    // Resolve avatar URL - prepend backend URL if it's a relative path
    let avatarUrl = officer.profile_picture || officer.photo || null
    if (avatarUrl && !avatarUrl.startsWith('http')) {
      avatarUrl = `http://127.0.0.1:8000${avatarUrl}`
    }
    
    return {
      id: officer.user_id || officer.id,
      fullName,
      position: officer.position || '',
      office: officer.department || '',
      academicYear: officer.academic_year || '',
      username: officer.username || officer.user?.username || '',
      avatarUrl,
      isActive: officer.is_active !== false,
    }
  })

  // Filter out invalid records
  const validOfficers = mappedOfficers.filter(
    officer => officer.isActive && officer.fullName && officer.fullName !== '-' && officer.position
  )

  // Duplicate officers for infinite loop (3 copies for smooth scrolling)
  const duplicatedOfficers = [...validOfficers, ...validOfficers, ...validOfficers]

  const scrollContainerRef = useRef(null)

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const scrollAmount = container.clientWidth * 0.5 // Scroll 50% of container width
    
    if (direction === 'left') {
      container.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    } else {
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

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
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <OfficerSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (validOfficers.length === 0) {
    return <EmptyLeadershipState />
  }

  return (
    <div className="relative">
      {/* Left Arrow Button */}
      <button
        onClick={() => handleScroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-4 flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg hover:bg-slate-50 hover:shadow-xl transition-all duration-200"
        aria-label="Scroll left"
      >
        <ChevronLeft className="h-6 w-6 text-slate-700" />
      </button>

      {/* Carousel Container */}
      <div
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-hide"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className={`flex gap-6 ${!isPaused ? 'animate-scroll' : ''}`}
          style={{
            animationDuration: '30s',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
            animationDirection: 'normal',
          }}
        >
          {duplicatedOfficers.map((officer, index) => (
            <div
              key={`${officer.id}-${index}`}
              className="flex-shrink-0 w-full sm:w-1/2 lg:w-1/4"
            >
              <OfficerCard officer={officer} />
            </div>
          ))}
        </div>
      </div>

      {/* Right Arrow Button */}
      <button
        onClick={() => handleScroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 shadow-lg hover:bg-slate-50 hover:shadow-xl transition-all duration-200"
        aria-label="Scroll right"
      >
        <ChevronRight className="h-6 w-6 text-slate-700" />
      </button>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-scroll {
          animation: scroll linear infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
