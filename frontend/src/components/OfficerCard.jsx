import { useState } from 'react'

export default function OfficerCard({ officer }) {
  const { fullName, position, office, academicYear, username, avatarUrl } = officer
  const [imageError, setImageError] = useState(false)

  // Generate initials from full name
  const getInitials = (name) => {
    if (!name) return 'IC'
    const parts = name.trim().split(' ')
    if (parts.length === 1) {
      return parts[0][0].toUpperCase()
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }

  const initials = getInitials(fullName)
  const hasValidAvatar = avatarUrl && !imageError

  return (
    <article
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      aria-label={`${position} - ${fullName}`}
    >
      {hasValidAvatar ? (
        <img
          src={avatarUrl}
          alt={fullName}
          className="h-56 w-full bg-slate-200 object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      ) : (
        <div className="flex h-56 w-full items-center justify-center bg-slate-200">
          <span className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-700 text-2xl font-bold text-white">
            {initials}
          </span>
        </div>
      )}
      <div className="p-6 text-center">
        <h3 className="mb-1 text-lg font-bold text-slate-900">{fullName}</h3>
        <p className="mb-2 font-semibold text-sky-600">{position}</p>
        {office && <p className="mb-2 text-sm text-slate-600">{office}</p>}
        {academicYear && <p className="text-xs text-slate-500">AY {academicYear}</p>}
        {username && <p className="mt-2 text-xs text-slate-400">@{username}</p>}
      </div>
    </article>
  )
}
