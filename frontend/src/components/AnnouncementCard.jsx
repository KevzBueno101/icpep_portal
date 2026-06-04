import { useState } from 'react'
import { Link } from 'react-router-dom'
import ImageModal from './ImageModal'

export default function AnnouncementCard({ announcement }) {
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
    achievement: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    opportunity: 'bg-amber-100 text-amber-800',
    event: 'bg-purple-100 text-purple-700',
  }

  const categoryColor = categoryColors[category] || categoryColors.announcement

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
          <div className="bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-800">
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
                // Hide broken image safely
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
          <span>
            {created_at
              ? new Date(created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Just now'}
          </span>
        </div>
      </article>
    </Link>
    </>
  )
}
