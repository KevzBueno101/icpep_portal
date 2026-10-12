import { useState } from 'react'
import { Link } from 'react-router-dom'
import ImageModal from './ImageModal'
import NewBadge from './NewBadge'
import { parseUrlsInText } from '../utils/urlParser.jsx'
import { Pin, Calendar, User, ArrowRight, Megaphone } from 'lucide-react'

export default function AnnouncementCard({ announcement, variant = 'default', isNew = false }) {
  const { id, title, body, category, created_at, author, pinned, first_image, images } =
    announcement || {}

  const [modalImages, setModalImages] = useState(null)
  const [modalInitialIndex, setModalInitialIndex] = useState(0)
  const [imgError, setImgError] = useState(false)

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
    news: 'bg-blue-100 text-blue-700',
    opinion: 'bg-violet-100 text-violet-700',
  }

  const catKey = (category || 'announcement').toLowerCase()
  const categoryColor = categoryColors[catKey] || categoryColors.announcement

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
          className="group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_-4px_rgba(14,165,233,0.18)] hover:ring-sky-200"
        >
          {pinned && (
            <div className="absolute left-3 top-3 z-10 flex items-center rounded-full bg-slate-900/85 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-md">
              <Pin size={12} className="mr-1 text-amber-400" />
              Pinned
            </div>
          )}

          {isNew && (
            <div className="absolute right-3 top-3 z-10">
              <NewBadge />
            </div>
          )}
          
          {firstImageUrl && !imgError ? (
            <div 
              className="relative aspect-[16/10] sm:aspect-[16/9] w-full max-h-[260px] sm:max-h-[340px] overflow-hidden bg-slate-100 cursor-pointer"
              onClick={(e) => handleImageClick(e, 0)}
            >
              <img
                src={firstImageUrl}
                alt={title || 'Announcement image'}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
                onError={() => setImgError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="relative h-20 sm:h-28 w-full bg-gradient-to-r from-sky-900/10 via-slate-900/5 to-indigo-900/10 flex items-center justify-between px-5 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-400 text-xs sm:text-sm font-medium">
                <Megaphone size={16} className="text-sky-500" />
                <span>Featured Community Announcement</span>
              </div>
            </div>
          )}

          <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-7 min-w-0">
            <div className="mb-2.5 sm:mb-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${categoryColor}`}>
                {catKey.charAt(0).toUpperCase() + catKey.slice(1)}
              </span>
            </div>

            <h3 className="mb-2 sm:mb-3 text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900 leading-snug sm:leading-tight line-clamp-2 sm:line-clamp-3 break-words group-hover:text-sky-600 transition-colors">
              {title}
            </h3>

            <p className="mb-4 sm:mb-6 flex-1 text-sm sm:text-base leading-relaxed text-slate-600 line-clamp-3 sm:line-clamp-4 break-words overflow-hidden">
              {parseUrlsInText(body)}
            </p>

            <div className="mt-auto border-t border-slate-100 pt-3.5 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm text-slate-500">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Calendar size={15} className="text-slate-400 shrink-0" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5 min-w-0 max-w-[160px] sm:max-w-[200px]">
                  <User size={15} className="text-slate-400 shrink-0" />
                  <span className="truncate" title={author || 'Admin'}>
                    {author && author.includes(',') ? (
                      <>
                        {author.split(',')[0].trim()}
                        {author.split(',')[1] && (
                          <>, <em className="opacity-80">{author.split(',')[1].trim()}</em></>
                        )}
                      </>
                    ) : (
                      author || 'Admin'
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-1.5 text-sky-600 font-semibold group-hover:text-sky-700 shrink-0 pt-1 sm:pt-0">
                <span>Read Full Announcement</span>
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
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
        className="group relative flex items-start gap-3 sm:gap-4 w-full min-w-0 rounded-2xl bg-white p-3 sm:p-4 shadow-sm ring-1 ring-slate-200/80 transition-all duration-300 hover:shadow-md hover:ring-sky-200 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
      >
        <div className="absolute left-0 top-0 h-full w-1 bg-sky-500 opacity-0 transition-opacity group-hover:opacity-100 rounded-l-2xl" />

        {firstImageUrl && !imgError && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-900/5">
            <img
              src={firstImageUrl}
              alt={title || 'Announcement'}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-center py-0.5">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold ${categoryColor}`}>
              {catKey.charAt(0).toUpperCase() + catKey.slice(1)}
            </span>
            {isNew && <NewBadge />}
            {pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                <Pin size={10} className="text-amber-500" />
                Pinned
              </span>
            )}
          </div>
          <h4 className="text-xs sm:text-sm md:text-base font-semibold text-slate-900 line-clamp-2 break-words leading-snug group-hover:text-sky-600 transition-colors">
            {title}
          </h4>
          <div className="mt-1 sm:mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] sm:text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar size={12} className="text-slate-400 shrink-0" />
              <span>{formattedDate}</span>
            </div>
            {author && (
              <div className="flex items-center gap-1 min-w-0 max-w-[120px] sm:max-w-[160px]">
                <User size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{author.split(',')[0].trim()}</span>
              </div>
            )}
          </div>
        </div>

        <ArrowRight size={16} className="text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-sky-500 hidden sm:block shrink-0 self-center" />
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
        className="block w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
      >
        {pinned && (
          <div className="flex items-center bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-800">
            <Pin size={14} className="mr-1 inline" />
            Pinned
          </div>
        )}

        {firstImageUrl && !imgError && (
          <div 
            className="relative h-36 sm:h-44 w-full overflow-hidden bg-slate-50 cursor-pointer group"
            onClick={(e) => handleImageClick(e, 0)}
          >
            <img
              src={firstImageUrl}
              alt={title || 'Announcement image'}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={() => setImgError(true)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>
        )}

        <article className="p-4 sm:p-6 min-w-0">
          <div className="mb-2.5 flex items-start justify-between">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${categoryColor}`}>
              {catKey.charAt(0).toUpperCase() + catKey.slice(1)}
            </span>
            {isNew && <NewBadge />}
          </div>

          <h3 className="mb-2 text-base sm:text-lg font-bold text-slate-900 line-clamp-2 break-words">{title}</h3>
          <p className="mb-4 whitespace-pre-wrap text-xs sm:text-sm leading-6 text-slate-600 break-words overflow-hidden">
            {parseUrlsInText(body)}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span className="truncate max-w-[150px]">
              {author && author.includes(',') ? author.split(',')[0].trim() : (author || 'Admin')}
            </span>
            <span>{formattedDate}</span>
          </div>
        </article>
      </Link>
    </>
  )
}
