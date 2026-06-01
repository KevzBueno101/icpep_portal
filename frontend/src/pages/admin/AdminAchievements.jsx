import { useEffect, useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import ConfirmModal from '../../components/common/ConfirmModal'

const CATEGORY_OPTIONS = [
  { value: 'founding', label: 'Founding' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'recognition', label: 'Recognition' },
  { value: 'event', label: 'Event' },
  { value: 'community', label: 'Community' },
]

const AdminAchievements = () => {
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState(null)
  const [deletingMilestone, setDeletingMilestone] = useState(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    headline: '',
    description: '',
    content: '',
    date: '',
    category: 'achievement',
  })

  const [imageFiles, setImageFiles] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    fetchMilestones()
  }, [])

  const fetchMilestones = async () => {
    setLoading(true)
    try {
      const res = await api.get('/milestones/admin/')
      setMilestones(res.data)
    } catch (err) {
      toast.error('Failed to load milestones.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingMilestone(null)
    setFormData({
      title: '',
      headline: '',
      description: '',
      content: '',
      date: '',
      category: 'achievement',
    })
    setImageFiles([])
    setShowForm(true)
  }

  const handleEdit = (milestone) => {
    setEditingMilestone(milestone)
    setFormData({
      title: milestone.title,
      headline: milestone.headline,
      description: milestone.description,
      content: milestone.content,
      date: milestone.date,
      category: milestone.category,
    })
    setImageFiles([])
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...formData,
        date: formData.date || new Date().toISOString().split('T')[0],
      }

      let res
      if (editingMilestone) {
        res = await api.patch(`/milestones/admin/${editingMilestone.id}/`, payload)
        toast.success('Milestone updated successfully.')
      } else {
        res = await api.post('/milestones/admin/', payload)
        toast.success('Milestone created successfully.')
      }

      // Upload images if any
      if (imageFiles.length > 0) {
        await uploadImages(res.data.id, imageFiles)
      }

      setShowForm(false)
      fetchMilestones()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save milestone.')
    } finally {
      setSaving(false)
    }
  }

  const uploadImages = async (milestoneId, files) => {
    setUploadingImages(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData()
        formData.append('image', files[i])
        formData.append('order', i)
        await api.post(`/milestones/admin/${milestoneId}/images/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }
      toast.success('Images uploaded successfully.')
    } catch (err) {
      toast.error('Failed to upload some images.')
    } finally {
      setUploadingImages(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingMilestone) return

    try {
      await api.delete(`/milestones/admin/${deletingMilestone.id}/`)
      toast.success('Milestone deleted successfully.')
      setDeletingMilestone(null)
      fetchMilestones()
    } catch (err) {
      toast.error('Failed to delete milestone.')
    }
  }

  const handleDeleteImage = async (imageId) => {
    try {
      await api.delete(`/milestones/admin/images/${imageId}/`)
      toast.success('Image deleted.')
      fetchMilestones()
    } catch (err) {
      toast.error('Failed to delete image.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Achievements & Milestones</h2>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          + New Milestone
        </button>
      </div>

      {showForm && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingMilestone ? 'Edit Milestone' : 'Create New Milestone'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Milestone title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Headline *</label>
                <input
                  type="text"
                  required
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Short headline for timeline"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
              <textarea
                required
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Short description for timeline card"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Content (Blog) *</label>
              <textarea
                required
                rows={6}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Full content for detail page"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Images</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImageFiles(Array.from(e.target.files))}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
              <p className="mt-1 text-xs text-slate-500">Upload multiple images (will be ordered by upload order)</p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving || uploadingImages}
                className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : uploadingImages ? 'Uploading images...' : editingMilestone ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {milestones.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-slate-500">
            No milestones yet. Create your first achievement!
          </div>
        ) : (
          milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {milestone.category}
                    </span>
                    <span className="text-xs text-slate-500">{milestone.date}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{milestone.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{milestone.headline}</p>
                  <p className="mt-1 text-sm text-slate-500 line-clamp-2">{milestone.description}</p>
                  {milestone.images && milestone.images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-2">{milestone.images.length} image(s)</p>
                      <div className="grid grid-cols-3 gap-2">
                        {milestone.images.map((img) => (
                          <div key={img.id} className="relative group">
                            <img
                              src={img.image}
                              alt={milestone.title}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleDeleteImage(img.id)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Delete image"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(milestone)}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingMilestone(milestone)}
                    className="rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={!!deletingMilestone}
        variant="caution"
        title="Delete milestone?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        busy={false}
        onConfirm={handleDelete}
        onCancel={() => setDeletingMilestone(null)}
      />
    </div>
  )
}

export default AdminAchievements
