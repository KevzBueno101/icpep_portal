import { useState, useRef, useEffect } from 'react'
import { MoreVertical } from 'lucide-react'

export default function OfficerCard({ officer, onEdit, onDelete, canEdit }) {
  const { fullName, position, office, academicYear, email, username, avatarUrl } = officer || {}
  const [imageError, setImageError] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const getInitials = (name) => {
    if (!name) return 'IC'
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 1) return (parts[0][0] || 'I').toUpperCase()
    return ((parts[0][0] || 'I') + (parts[parts.length - 1][0] || 'C')).toUpperCase()
  }

  const initials = getInitials(fullName)
  const hasValidAvatar = avatarUrl && !imageError

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <article
      className="relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      aria-label={`${position} - ${fullName}`}
    >
      <div>
        {hasValidAvatar ? (
          <div className="flex h-48 w-full items-center justify-center bg-slate-100 pt-6">

            <img
              src={avatarUrl}
              alt={fullName}
              className="h-24 w-24 rounded-full bg-slate-200 object-cover sm:h-32 sm:w-32"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-slate-100 pt-6">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-sky-700 text-xl font-bold text-white sm:h-32 sm:w-32 sm:text-3xl">
              {initials}
            </span>
          </div>
        )}

        {canEdit && (
          <div className="absolute top-3 right-3" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="rounded-full bg-white/90 backdrop-blur p-2 text-slate-600 shadow-sm hover:bg-white hover:text-slate-900 transition-colors"
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-32 rounded-lg border border-slate-200 bg-white shadow-lg z-10">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit?.()
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete?.()
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}

        <div className="min-w-0 flex-1 p-4 text-center sm:p-5">
          <h3 className="mb-1 font-bold text-slate-900 line-clamp-2 text-base sm:text-xl">{fullName}</h3>

          {/* Position should always exist for valid officers; keep spacing consistent */}
          <p className="mb-2 font-semibold text-sky-600 line-clamp-1 text-[13px] sm:text-sm">{position}</p>

          {/* Keep vertical rhythm stable even when optional fields are missing */}
          <div className="min-h-[44px]">
            {office ? (
              <p className="mb-2 text-[13px] text-slate-600 line-clamp-1 sm:text-sm">{office}</p>
            ) : (
              <div className="mb-2 h-5" />
            )}

            {academicYear ? (
              <p className="text-[11px] text-slate-500 font-medium sm:text-xs">AY {academicYear}</p>
            ) : (
              <div className="h-4" />
            )}
          </div>

          {email || username ? (
            <a
              href={email ? `mailto:${email}` : undefined}
              className="mt-2 inline-block text-[11px] text-slate-400 line-clamp-1 transition hover:text-slate-600 font-medium sm:text-xs"
            >
              {email || username}
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}


