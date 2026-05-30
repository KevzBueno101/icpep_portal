import { useEffect } from 'react'

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'caution',
  busy = false,
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

  if (!isOpen) return null

  const variantStyles =
    variant === 'info'
      ? {
          icon: 'ℹ️',
          ring: 'ring-sky-400/60',
          badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
          confirmBg: 'bg-sky-600 hover:bg-sky-700',
        }
      : {
          icon: '⚠️',
          ring: 'ring-amber-400/60',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
          confirmBg: 'bg-amber-600 hover:bg-amber-700',
        }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-900/5">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div
              className={
                'mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border ' +
                variantStyles.badgeBg
              }
            >
              <span className="text-lg">{variantStyles.icon}</span>
            </div>

            <div className="min-w-0 flex-1">
              {title && <h3 className="text-base font-bold text-slate-900">{title}</h3>}
              {description && (
                <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={
              'rounded-full px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ' +
              variantStyles.confirmBg
            }
          >
            {busy ? 'Please wait…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

