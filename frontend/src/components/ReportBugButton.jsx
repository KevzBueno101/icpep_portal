import { useCallback, useEffect, useRef, useState } from 'react'
import { Bug, ImagePlus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { publicApi } from '../api/axios'

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical']
const MAX_SCREENSHOT_MB = 5

export default function ReportBugButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    page: typeof window !== 'undefined' ? window.location.pathname : '',
    summary: '',
    severity: 'Medium',
    steps: '',
  })
  const [screenshot, setScreenshot] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const clearScreenshot = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setScreenshot(null)
    setPreviewUrl(null)
    if (fileRef.current) fileRef.current.value = ''
  }, [previewUrl])

  const openModal = () => {
    setForm((prev) => ({
      ...prev,
      page: typeof window !== 'undefined' ? window.location.pathname : prev.page,
    }))
    setIsOpen(true)
  }

  const closeModal = () => {
    if (sending) return
    clearScreenshot()
    setIsOpen(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, etc.).')
      e.target.value = ''
      return
    }
    if (file.size > MAX_SCREENSHOT_MB * 1024 * 1024) {
      toast.error(`Screenshot must be ${MAX_SCREENSHOT_MB} MB or smaller.`)
      e.target.value = ''
      return
    }
    clearScreenshot()
    const url = URL.createObjectURL(file)
    setScreenshot(file)
    setPreviewUrl(url)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (screenshot) fd.append('screenshot', screenshot)

      await publicApi.post('/feedback/bug-report/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      toast.success('Bug report sent. Thank you!')
      clearScreenshot()
      setForm((prev) => ({
        ...prev,
        name: '',
        email: '',
        summary: '',
        severity: 'Medium',
        steps: '',
      }))
      setIsOpen(false)
    } catch (err) {
      const data = err.response?.data
      let detail =
        data?.detail ||
        data?.email?.[0] ||
        data?.summary?.[0] ||
        data?.screenshot?.[0] ||
        err.message ||
        'Failed to send the report. Please try again.'
      if (typeof detail !== 'string') detail = 'Failed to send the report. Please try again.'
      toast.error(detail)
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="group fixed bottom-24 right-5 z-50 flex items-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-900/30 transition hover:bg-rose-500 hover:shadow-xl"
        aria-label="Report a bug"
      >
        <Bug className="h-5 w-5" />
        <span className="hidden sm:inline">Report a Bug</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 overflow-y-auto px-4 py-10"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <Bug className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Report a Bug</h2>
                  <p className="text-sm text-slate-500">Found an issue? Let us fix it.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                aria-label="Close bug report"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bug-name" className="mb-1 block text-xs font-semibold text-slate-700">
                    Your Name
                  </label>
                  <input
                    id="bug-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Juan Dela Cruz"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label htmlFor="bug-email" className="mb-1 block text-xs font-semibold text-slate-700">
                    Your Email
                  </label>
                  <input
                    id="bug-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bug-page" className="mb-1 block text-xs font-semibold text-slate-700">
                  Page
                </label>
                <input
                  id="bug-page"
                  name="page"
                  type="text"
                  value={form.page}
                  onChange={handleChange}
                  placeholder="/login"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="bug-summary" className="mb-1 block text-xs font-semibold text-slate-700">
                  What happened? <span className="text-rose-500">*</span>
                </label>
                <input
                  id="bug-summary"
                  name="summary"
                  type="text"
                  value={form.summary}
                  onChange={handleChange}
                  required
                  placeholder="Briefly describe the bug"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="bug-severity" className="mb-1 block text-xs font-semibold text-slate-700">
                  Severity
                </label>
                <select
                  id="bug-severity"
                  name="severity"
                  value={form.severity}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                >
                  {SEVERITIES.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="bug-steps" className="mb-1 block text-xs font-semibold text-slate-700">
                  Steps to reproduce <span className="text-slate-400">(optional)</span>
                </label>
                <textarea
                  id="bug-steps"
                  name="steps"
                  value={form.steps}
                  onChange={handleChange}
                  rows={4}
                  placeholder={'1. Go to...\n2. Click...\n3. Observed...'}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all duration-200"
                />
              </div>

              {/* Screenshot upload */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Screenshot <span className="text-slate-400">(optional, max {MAX_SCREENSHOT_MB} MB)</span>
                </label>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshot}
                  className="hidden"
                  aria-hidden
                  tabIndex={-1}
                />

                {previewUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={previewUrl}
                      alt="Screenshot preview"
                      className="h-32 rounded-xl border border-slate-200 object-cover shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={clearScreenshot}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-white shadow hover:bg-rose-700"
                      aria-label="Remove screenshot"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 transition hover:border-sky-400 hover:text-sky-600"
                  >
                    <ImagePlus className="h-5 w-5 shrink-0" />
                    <span>Click to attach a screenshot</span>
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? 'Sending…' : 'Send Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}