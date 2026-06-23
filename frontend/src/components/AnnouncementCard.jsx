import { useState } from 'react'
import { Link } from 'react-router-dom'
import ImageModal from './ImageModal'

import { Pin, Calendar, User, ArrowRight } from 'lucide-react'

export default function AnnouncementCard({ announcement, variant = 'default' }) {
  const { id, title, body, category, created_at, author, pinned, first_image, images } =
    announcement

  const [modalImages, setModalImages] = useState(null)
  const [modalInitialIndex, setModalInitialIndex] = useState(0)

  const firstImageUrl = first_image || images?.[0]?.image

  const handleImageClick = (e, index = 0) => {
    e.preventDefault()
    e.stopPropagation()
    const imageUrls = images?.map(img => img.image).filter(Boolean) || [firstImageUrl].filter(Boolean)
    if (imageUrls.length > 0) {
      setModalImages(imageUrls)
      setModalInitialIndex(index)
    }
  }

  const handleCloseModal = () => {
    setModalImages(null)
    setModalInitialIndex(0)
  }

  const categoryColors = {
    announcement: 'bg-sky-100 text-sky-700',
    update: 'bg-indigo-100 text-indigo-700',
    achievement: 'bg-emerald-100 text-emerald-700',
    opportunity: 'bg-amber-100 text-amber-800',
    event: 'bg-teal-100 text-teal-700',
    deadline: 'bg-rose-100 text-rose-700',
  }

  const categoryColor = categoryColors[category] || categoryColors.announcement

  const formattedDate = created_at
    ? new Date(created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Just now'

  if (variant === 'featured') {
    return (
      <>
        {modalImages && (
          <ImageModal images={modalImages} initialIndex={modalInitialIndex} onClose={handleCloseModal} />
        )}
        <Link
          to={`/announcement/${id}`}
          className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(14,165,233,0.15)] hover:ring-sky-200"
        >
          {pinned && (
            <div className="absolute left-3 top-3 z-10 flex items-center rounded-full bg-slate-900/80 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-md">
              <Pin size={12} className="mr-1" />
              Pinned
            </div>
          )}
          
          <div 
            className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 cursor-pointer"
            onClick={(e) => handleImageClick(e, 0)}
          >
            {firstImageUrl ? (
              <>
                <img
                  src={firstImageUrl}
                  alt={title || 'Announcement image'}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-slate-100">
                 <span className="text-slate-400">No Image Available</span>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col p-6 sm:p-8">
            <div className="mb-4">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${categoryColor}`}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
            </div>

            <h3 className="mb-3 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl line-clamp-2">
              {title}
            </h3>
            
            <p className="mb-6 flex-1 text-base leading-relaxed text-slate-600 line-clamp-3">
              {body}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-y-3 gap-x-6 border-t border-slate-100 pt-5 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span>{author || 'Admin'}</span>
              </div>
              <div className="flex items-center gap-2 ml-auto text-sky-600 font-medium group-hover:text-sky-700">
                Read Full Announcement <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        </Link>
      </>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        to={`/announcement/${id}`}
        className="group relative flex h-[100px] shrink-0 items-center gap-4 overflow-hidden rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 transition-all duration-300 hover:shadow-md hover:ring-slate-300 hover:-translate-y-0.5"
      >
        <div className="absolute left-0 top-0 h-full w-1 bg-sky-500 opacity-0 transition-opacity group-hover:opacity-100" />
        
        {firstImageUrl && (
          <div className="h-[60px] w-[100px] shrink-0 overflow-hidden rounded-lg bg-slate-100">
            <img
              src={firstImageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <div className="mb-1 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${categoryColor}`}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
            {pinned && <Pin size={12} className="text-amber-500" />}
          </div>
          <h4 className="truncate text-base font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
            {title}
          </h4>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <Calendar size={12} />
            <span>{formattedDate}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <>
      {modalImages && (
        <ImageModal
          images={modalImages}
          initialIndex={modalInitialIndex}
          onClose={handleCloseModal}
        />
      )}
      <Link
        to={`/announcement/${id}`}
        className="block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      >
        {pinned && (
          <div className="flex items-center bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-800">
            <Pin size={14} className="mr-1 inline" />
            Pinned
          </div>
        )}

        {firstImageUrl && (
          <div 
            className="relative h-40 w-full overflow-hidden bg-slate-50 cursor-pointer group"
            onClick={(e) => handleImageClick(e, 0)}
          >
            <img
              src={firstImageUrl}
              alt={title || 'Announcement image'}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>
        )}

      <article className={firstImageUrl ? 'p-6' : 'p-6'}>
        <div className="mb-3 flex items-start justify-between">
          <span
            className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${categoryColor}`}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>

        <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
        <p className="mb-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{body}</p>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{author || 'Admin'}</span>
          <span>{formattedDate}</span>
        </div>
      </article>
    </Link>
    </>
  )
}
