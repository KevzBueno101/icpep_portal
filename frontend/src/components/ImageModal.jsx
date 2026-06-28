import { useState, useEffect, useRef } from 'react'

export default function ImageModal({ images, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }



  const handleTouchStart = (e) => {
    touchStartX.current = e.changedTouches[0].screenX
  }

  const handleTouchMove = (e) => {
    touchEndX.current = e.changedTouches[0].screenX
  }

  const handleTouchEnd = () => {
    const swipeThreshold = 50
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        goToNext()
      } else {
        goToPrevious()
      }
    }
  }

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [onClose, images.length])

  if (!images || images.length === 0) return null

  const currentImage = images[currentIndex]
  const hasMultiple = images.length > 1

  return (
      <div className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm">
        {/* Close button - on the overlay, always visible */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div
          className="flex items-center justify-center w-full h-full"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
          onTouchStart={(e) => {
            if (e.target === e.currentTarget) handleTouchStart(e)
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) handleTouchMove(e)
          }}
          onTouchEnd={(e) => {
            if (e.target === e.currentTarget) handleTouchEnd(e)
          }}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Image */}
            <img
              src={typeof currentImage === 'string' ? currentImage : currentImage.image}
              alt={`Image ${currentIndex + 1}`}
              className="max-h-[85vh] max-w-full object-contain rounded-lg"
            />

            {/* Navigation buttons */}
            {hasMultiple && (
              <>
                <button
                  type="button"
                  onClick={goToPrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Previous image"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition focus:outline-none focus:ring-2 focus:ring-white/50"
                  aria-label="Next image"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image counter */}
            {hasMultiple && (
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-medium text-white/80">
                {currentIndex + 1} / {images.length}
              </div>
            )}

            {/* Dots indicator */}
            {hasMultiple && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex ? 'w-6 bg-white' : 'w-2 bg-white/50'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  )
}
