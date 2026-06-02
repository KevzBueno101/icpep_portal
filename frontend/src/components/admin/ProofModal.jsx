import { useEffect, useMemo } from 'react'

export default function ProofModal({
  isOpen,
  title,
  description,
  proofItems = [],
  isBusy = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onCancel])

  const hasProof = proofItems?.length > 0
  const proofCountText = useMemo(() => {
    if (!proofItems) return ''
    return proofItems.length === 1 ? '1 file' : `${proofItems.length} files`
  }, [proofItems])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-3xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-lg sm:text-xl font-bold text-slate-950">{title}</h2>}
            {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
            {hasProof && <p className="mt-2 text-xs font-semibold text-slate-500">{proofCountText}</p>}
          </div>

          <button
            type="button"
            onClick={() => onCancel?.()}
            disabled={isBusy}
            className="shrink-0 rounded-full p-1.5 hover:bg-slate-100 text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body + Footer: footer always visible, body scrolls */}
        <div className="flex flex-col max-h-[90vh]">
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {!hasProof ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
                No uploaded documents.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {proofItems.map((item, idx) => (
                  <div key={idx} className="rounded-2xl border border-slate-200 overflow-hidden bg-white">
                    <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {item.label || `Proof ${idx + 1}`}
                      </p>
                      {item.src ? (
                        <a
                          href={item.src}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-sky-700 hover:text-sky-800"
                        >
                          Open
                        </a>
                      ) : null}
                    </div>

                    {item.src ? (
                      <div className="w-full max-h-72 overflow-auto bg-slate-50">
                        <img
                          src={item.src}
                          alt={item.label || `Proof ${idx + 1}`}
                          className="w-full h-auto object-contain"
                        />
                      </div>
                    ) : (
                      <div className="p-6 text-sm text-slate-500">No image</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex flex-col gap-2 sm:flex-row sm:justify-end sm:items-center shrink-0">
            <button
              type="button"
              onClick={() => onCancel?.()}
              disabled={isBusy}
              className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={() => onConfirm?.()}
              disabled={isBusy}
              className="rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? 'Processing…' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

