import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import ConfirmModal from '../../components/common/ConfirmModal'
import SortableList from '../../components/admin/SortableList'
import CardSkeleton from '../../components/skeletons/CardSkeleton'
import {
  CheckCircle2,
  Eye,
  Download,
  X,
  FileText,
  Image as ImageIcon,
  Target,
  ScrollText,
  Gavel,
  History,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

const SECTION_TYPES = [
  { value: 'MISSION', label: 'Mission' },
  { value: 'VISION', label: 'Vision' },
  { value: 'GOALS', label: 'Goals' },
  { value: 'HISTORY', label: 'History' },
  { value: 'CONSTITUTION', label: 'Constitution & By-Laws' },
  { value: 'RESOLUTION', label: 'Resolution' },
  { value: 'CUSTOM', label: 'Custom' },
]

const emptyForm = {
  section_type: 'MISSION',
  title: '',
  body: '',
  document_name: '',
  is_published: true,
}

const isPdf = (section) => {
  const name = (section.document_name || section.document_url || '').toLowerCase()
  return name.endsWith('.pdf')
}

const ALLOWED_DOCUMENT_TYPES = ['pdf', 'png', 'jpg', 'jpeg']

const isAllowedDocument = (file) => {
  const ext = (file?.name?.split('.').pop() || '').toLowerCase()
  return ALLOWED_DOCUMENT_TYPES.includes(ext)
}

const isCoreValues = (section) =>
  section.section_type === 'CUSTOM' &&
  (section.title || '').toLowerCase().includes('core value')

const CATEGORY_DEFS = [
  {
    key: 'MVC',
    label: 'MVC',
    subtitle: 'Mission, Vision, Core Values & Goals',
    icon: Target,
    iconBox: 'bg-sky-50 text-sky-600',
    chip: 'bg-sky-100 text-sky-700',
    defaultType: 'MISSION',
  },
  {
    key: 'CONSTITUTION',
    label: 'Constitution',
    subtitle: 'Constitution & By-Laws',
    icon: ScrollText,
    iconBox: 'bg-violet-50 text-violet-600',
    chip: 'bg-violet-100 text-violet-700',
    defaultType: 'CONSTITUTION',
  },
  {
    key: 'HISTORY',
    label: 'History',
    subtitle: 'History of the organization',
    icon: History,
    iconBox: 'bg-amber-50 text-amber-600',
    chip: 'bg-amber-100 text-amber-700',
    defaultType: 'HISTORY',
  },
  {
    key: 'RESOLUTION',
    label: 'Resolution',
    subtitle: 'Resolutions & decisions',
    icon: Gavel,
    iconBox: 'bg-rose-50 text-rose-600',
    chip: 'bg-rose-100 text-rose-700',
    defaultType: 'RESOLUTION',
  },
  {
    key: 'CUSTOM',
    label: 'Custom / Others',
    subtitle: 'Other sections',
    icon: FolderOpen,
    iconBox: 'bg-slate-100 text-slate-600',
    chip: 'bg-slate-100 text-slate-700',
    defaultType: 'CUSTOM',
  },
]

const categoryFor = (section) => {
  if (isCoreValues(section)) return 'MVC'
  if (['MISSION', 'VISION', 'GOALS'].includes(section.section_type)) return 'MVC'
  if (section.section_type === 'CONSTITUTION') return 'CONSTITUTION'
  if (section.section_type === 'HISTORY') return 'HISTORY'
  if (section.section_type === 'RESOLUTION') return 'RESOLUTION'
  return 'CUSTOM'
}

const AdminAbout = () => {
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)
  const [fileUploading, setFileUploading] = useState(false)

  const [localOrderIds, setLocalOrderIds] = useState([])
  const [saved, setSaved] = useState(false)
  const savedTimerRef = useRef(null)

  const [showForm, setShowForm] = useState(false)
  const [editingSection, setEditingSection] = useState(null)
  const [expandedSectionId, setExpandedSectionId] = useState(null)
  const [formData, setFormData] = useState(emptyForm)
  const [selectedFile, setSelectedFile] = useState(null)

  const [deletingSection, setDeletingSection] = useState(null)
  const [previewingSection, setPreviewingSection] = useState(null)
  const [previewSrc, setPreviewSrc] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState(null)

  const isEditMode = !!editingSection

  async function fetchSections() {
    setLoading(true)
    try {
      const res = await api.get('/about/admin/')
      const results = res.data.results
      setSections(results)
      setLocalOrderIds(results.map((s) => s.id))
    } catch {
      toast.error('Failed to load about sections.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSections()
  }, [])

  useEffect(() => {
    const url = previewSrc
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [previewSrc])

  const handleCreate = (presetCategory) => {
    setEditingSection(null)
    setExpandedSectionId(null)
    const preset = CATEGORY_DEFS.find((c) => c.key === presetCategory)
    setFormData({
      ...emptyForm,
      section_type: preset ? preset.defaultType : emptyForm.section_type,
    })
    setSelectedFile(null)
    setShowForm(true)
  }

  const handleEdit = (section) => {
    setEditingSection(section)
    setExpandedSectionId(section.id)
    setShowForm(false)
    setSelectedFile(null)
    setFormData({
      section_type: section.section_type || 'CUSTOM',
      title: section.title || '',
      body: section.body || '',
      document_name: section.document_name || '',
      is_published: section.is_published !== false,
    })
  }

  const handleCancelEdit = () => {
    setShowForm(false)
    setEditingSection(null)
    setExpandedSectionId(null)
    setSelectedFile(null)
    setFormData(emptyForm)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const baseFields = {
        section_type: formData.section_type,
        title: formData.title.trim(),
        body: formData.body.trim(),
        is_published: formData.is_published,
      }
      const hasFile = !!selectedFile
      let payload
      let headers = {}
      if (hasFile) {
        payload = new FormData()
        Object.entries(baseFields).forEach(([key, value]) => payload.append(key, value))
        payload.append('document', selectedFile)
        payload.append('document_name', selectedFile.name)
        headers = { 'Content-Type': 'multipart/form-data' }
      } else {
        payload = baseFields
      }

      if (editingSection) {
        await api.patch(`/about/admin/${editingSection.id}/`, payload, headers)
        toast.success('About section updated.')
      } else {
        await api.post('/about/admin/', payload, headers)
        toast.success('About section created.')
      }

      handleCancelEdit()
      fetchSections()
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.document?.[0] ||
        err.response?.data?.document_name?.[0] ||
        'Failed to save about section.'
      toast.error(detail)
    } finally {
      setSaving(false)
    }
  }

  const handleTogglePublish = async (section) => {
    try {
      await api.patch(`/about/admin/${section.id}/`, {
        is_published: !section.is_published,
      })
      fetchSections()
    } catch {
      toast.error('Failed to update publish status.')
    }
  }

  const handleDelete = async () => {
    if (!deletingSection) return
    try {
      await api.delete(`/about/admin/${deletingSection.id}/`)
      toast.success('About section deleted.')
      setDeletingSection(null)
      fetchSections()
    } catch {
      toast.error('Failed to delete about section.')
    }
  }

  const handleRemoveDocument = async (section) => {
    setFileUploading(true)
    try {
      await api.delete(`/about/admin/${section.id}/document/`)
      toast.success('Document removed.')
      fetchSections()
    } catch {
      toast.error('Failed to remove document.')
    } finally {
      setFileUploading(false)
    }
  }

  const handleDownload = async (section) => {
    if (!section.document_url) return
    try {
      const res = await api.get(section.document_url, { responseType: 'blob' })
      const objectUrl = URL.createObjectURL(res.data)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = section.document_name || 'document'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      toast.error('Download failed.')
    }
  }

  const openPreview = async (section) => {
    if (!section.document_url) return
    setPreviewingSection(section)
    if (!isPdf(section)) {
      setPreviewSrc(section.document_url)
      setPreviewLoading(false)
      return
    }
    setPreviewLoading(true)
    setPreviewSrc(null)
    try {
      const res = await fetch(section.document_url)
      if (!res.ok) throw new Error('Preview fetch failed')
      const blob = await res.blob()
      setPreviewSrc(URL.createObjectURL(blob))
    } catch {
      toast.error('Failed to load document preview.')
    } finally {
      setPreviewLoading(false)
    }
  }

  const closePreview = () => {
    setPreviewLoading(false)
    setPreviewSrc(null)
    setPreviewingSection(null)
  }

  const typeLabel = (value) =>
    SECTION_TYPES.find((t) => t.value === value)?.label || value

  const orderedSections = useMemo(() => {
    if (localOrderIds.length === 0) return sections
    const map = new Map(sections.map((s) => [s.id, s]))
    return localOrderIds.map((id) => map.get(id)).filter(Boolean)
  }, [sections, localOrderIds])

  const groupedSections = useMemo(() => {
    const map = new Map(CATEGORY_DEFS.map((c) => [c.key, []]))
    orderedSections.forEach((s) => {
      const key = categoryFor(s)
      if (map.has(key)) map.get(key).push(s)
      else map.get('CUSTOM').push(s)
    })
    return map
  }, [orderedSections])

  const handleCategoryReorder = useCallback(
    async (orderedIds) => {
      const catKey = activeCategory
      if (!catKey) return
      const catIds = new Set((groupedSections.get(catKey) || []).map((s) => s.id))
      const slots = []
      localOrderIds.forEach((id, idx) => {
        if (catIds.has(id)) slots.push(idx)
      })
      const nextFull = [...localOrderIds]
      slots.forEach((slot, idx) => {
        nextFull[slot] = orderedIds[idx]
      })
      setLocalOrderIds(nextFull)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      try {
        await api.post('/about/admin/reorder/', { ordered_ids: nextFull })
        setSaved(true)
        savedTimerRef.current = setTimeout(() => setSaved(false), 2000)
      } catch {
        toast.error('Failed to save order.')
        setLocalOrderIds(sections.map((s) => s.id))
      }
    },
    [activeCategory, localOrderIds, groupedSections, sections],
  )

  const sectionTypeSelect = (extraClass = '') => (
    <select
      value={formData.section_type}
      onChange={(e) => setFormData({ ...formData, section_type: e.target.value })}
      className={`w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 ${extraClass}`}
    >
      {SECTION_TYPES.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )

  const renderSectionCard = (section) => {
    const isCardEditing = section.id === expandedSectionId
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {isCardEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Edit Section</h3>
                <p className="text-sm text-slate-500">Update this section inline.</p>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Section Type</label>
                  {sectionTypeSelect()}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    placeholder="e.g. Our Mission"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Content</label>
                <textarea
                  rows={5}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Section content."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Replace document (PDF or image, optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    if (file && !isAllowedDocument(file)) {
                      toast.error('Unsupported file type. Only PDF, PNG, JPG, or JPEG files are allowed.')
                      e.target.value = ''
                      setSelectedFile(null)
                      return
                    }
                    setSelectedFile(file)
                  }}
                  className="w-full cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                {selectedFile && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    <span className="truncate">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                Published (visible on the About page)
              </label>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={saving || fileUploading}
                  className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Update'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                  {typeLabel(section.section_type)}
                </span>
                {section.document_url && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                    <FileText className="h-3 w-3" />
                    {section.document_name || 'Document'}
                  </span>
                )}
                {!section.is_published && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    Draft
                  </span>
                )}
                <span className="text-xs text-slate-500">
                  {new Date(section.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{section.title}</h3>
              {section.body ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {section.body}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-slate-400">No text content.</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {section.document_url && (
                <>
                  <button
                    type="button"
                    onClick={() => openPreview(section)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Eye className="h-4 w-4" /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(section)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" /> Download
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => handleTogglePublish(section)}
                className="rounded-full border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
              >
                {section.is_published ? 'Unpublish' : 'Publish'}
              </button>
              <button
                type="button"
                onClick={() => handleEdit(section)}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => setDeletingSection(section)}
                className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <CardSkeleton count={3} />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin</p>
          <div className="mt-2 flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-slate-900">About Orgs</h2>
            <span className={`inline-flex items-center gap-1 text-sm font-medium text-emerald-600 transition-opacity duration-300 ${saved ? 'opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Sections are grouped into categories — pick a category to manage its sections, order, or documents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleCreate(activeCategory)}
          className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          + Add Section
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {isEditMode ? 'Edit Section' : 'Create Section'}
            </h3>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Section Type</label>
                {sectionTypeSelect()}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="e.g. Our Mission"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Content</label>
              <textarea
                rows={6}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Section content. Use new lines for list items (e.g. Core Values)."
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Attach document (PDF or image, optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null
                    if (file && !isAllowedDocument(file)) {
                      toast.error('Unsupported file type. Only PDF, PNG, JPG, or JPEG files are allowed.')
                      e.target.value = ''
                      setSelectedFile(null)
                      return
                    }
                    setSelectedFile(file)
                  }}
                  className="w-full cursor-pointer rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                {selectedFile && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
                    <span className="truncate">{selectedFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {isEditMode && editingSection?.document_url && !selectedFile && (
                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-900">Current document</div>
                  <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-3">
                    <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                      <FileText className="h-4 w-4 text-sky-600" />
                      <span className="truncate">{editingSection.document_name || 'attached document'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => openPreview(editingSection)}
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(editingSection)}
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Download
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(editingSection)}
                      disabled={fileUploading}
                      className="rounded-full border border-red-300 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={formData.is_published}
                onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              Published (visible on the About page)
            </label>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={saving || fileUploading}
                className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {activeCategory ? (
          (() => {
            const def = CATEGORY_DEFS.find((c) => c.key === activeCategory)
            const items = groupedSections.get(activeCategory) || []
            return (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> Categories
                  </button>
                  <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${def.iconBox}`}>
                    <def.icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-slate-900">{def.label}</h3>
                    <p className="text-xs text-slate-500">{def.subtitle}</p>
                  </div>
                  <span className={`ml-auto rounded-full px-3 py-1 text-xs font-semibold ${def.chip}`}>
                    {items.length} {items.length === 1 ? 'section' : 'sections'}
                  </span>
                </div>

                {items.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                    <p className="text-slate-500">No sections in this category yet.</p>
                    <button
                      type="button"
                      onClick={() => handleCreate(activeCategory)}
                      className="mt-4 rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                    >
                      + Add Section
                    </button>
                  </div>
                ) : (
                  <SortableList
                    items={items}
                    onReorder={handleCategoryReorder}
                    className="space-y-4"
                    renderItem={renderSectionCard}
                  />
                )}
              </div>
            )
          })()
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORY_DEFS.map((def) => {
              const count = groupedSections.get(def.key)?.length || 0
              return (
                <button
                  key={def.key}
                  type="button"
                  onClick={() => setActiveCategory(def.key)}
                  className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${def.iconBox}`}>
                      <def.icon className="h-6 w-6" />
                    </span>
                    <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-sky-500" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{def.label}</h3>
                    <p className="mt-0.5 text-xs text-slate-500">{def.subtitle}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${def.chip}`}>
                    {count} {count === 1 ? 'section' : 'sections'}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!deletingSection}
        variant="caution"
        title="Delete about section?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        busy={false}
        onConfirm={handleDelete}
        onCancel={() => setDeletingSection(null)}
      />

      {previewingSection && previewingSection.document_url && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 p-4 sm:items-center">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
              <div className="flex min-w-0 items-center gap-2">
                {isPdf(previewingSection) ? (
                  <FileText className="h-5 w-5 shrink-0 text-sky-600" />
                ) : (
                  <ImageIcon className="h-5 w-5 shrink-0 text-violet-600" />
                )}
                <span className="truncate text-sm font-semibold text-slate-900">
                  {previewingSection.document_name || 'Document'}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(previewingSection)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" /> Download
                </button>
                <button
                  type="button"
                  onClick={closePreview}
                  className="inline-flex items-center rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto bg-slate-100 p-4">
              {isPdf(previewingSection) ? (
                previewLoading ? (
                  <div className="flex items-center justify-center py-24 text-sm text-slate-500">
                    Loading preview…
                  </div>
                ) : previewSrc ? (
                  <iframe
                    title={previewingSection.document_name || 'PDF preview'}
                    src={previewSrc}
                    className="h-full min-h-[65vh] w-full rounded-xl border border-slate-200 bg-white"
                  />
                ) : (
                  <div className="flex items-center justify-center py-24 text-sm text-red-500">
                    Failed to load preview.
                  </div>
                )
              ) : (
                <img
                  src={previewingSection.document_url}
                  alt={previewingSection.document_name || 'Document preview'}
                  className="mx-auto max-h-[70vh] w-auto rounded-xl border border-slate-200 bg-white p-2"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAbout