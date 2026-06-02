import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../../api/axios'
import ConfirmModal from '../../../components/common/ConfirmModal'

const CATEGORY_OPTIONS = [
  { value: 'announcement', label: 'Announcement' },
  { value: 'achievement', label: 'Achievement' },
  { value: 'update', label: 'Update' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'event', label: 'Event' },
]

const emptyForm = {
  title: '',
  body: '',
  category: 'announcement',
  author: '',
  pinned: false,
  is_published: true,
}

const AdminAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState(null)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await api.get('/announcements/admin/')
      setAnnouncements(res.data.results)
    } catch (err) {
      toast.error('Failed to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAnnouncement(null)
    setFormData(emptyForm)
    setShowForm(true)
  }

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title || '',
      body: announcement.body || '',
      category: announcement.category || 'announcement',
      author: announcement.author || '',
      pinned: !!announcement.pinned,
      is_published: announcement.is_published !== false,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const payload = {
        ...formData,
        author: formData.author.trim(),
      }

      if (editingAnnouncement) {
        await api.patch(`/announcements/admin/${editingAnnouncement.id}/`, payload)
        toast.success('Announcement updated.')
      } else {
        await api.post('/announcements/admin/', payload)
        toast.success('Announcement created.')
      }

      setShowForm(false)
      setEditingAnnouncement(null)
      setFormData(emptyForm)
      fetchAnnouncements()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save announcement.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingAnnouncement) return

    try {
      await api.delete(`/announcements/admin/${deletingAnnouncement.id}/`)
      toast.success('Announcement deleted.')
      setDeletingAnnouncement(null)
      fetchAnnouncements()
    } catch (err) {
      toast.error('Failed to delete announcement.')
    }
  }

  const handleTogglePinned = async (announcement) => {
    try {
      await api.patch(`/announcements/admin/${announcement.id}/`, {
        pinned: !announcement.pinned,
      })
      fetchAnnouncements()
    } catch (err) {
      toast.error('Failed to update pinned status.')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-sky-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-slate-500">Admin</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Announcements</h2>
        </div>
        <button
          type="button"
          onClick={handleCreate}
          className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
        >
          + New Announcement
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">
            {editingAnnouncement ? 'Edit Announcement' : 'Create Announcement'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Announcement title"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Body *</label>
              <textarea
                required
                rows={6}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                placeholder="Write the announcement details"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Author</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                  placeholder="Defaults to current admin"
                />
              </div>

              <div className="flex items-center gap-5 pt-6">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.pinned}
                    onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  Pinned
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  />
                  Published
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : editingAnnouncement ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingAnnouncement(null)
                }}
                className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
            No announcements yet.
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                      {announcement.category}
                    </span>
                    {announcement.pinned && (
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                        Pinned
                      </span>
                    )}
                    {!announcement.is_published && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        Draft
                      </span>
                    )}
                    <span className="text-xs text-slate-500">
                      {new Date(announcement.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{announcement.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">By {announcement.author || 'Admin'}</p>
                  <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {announcement.body}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleTogglePinned(announcement)}
                    className="rounded-full border border-amber-300 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50"
                  >
                    {announcement.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(announcement)}
                    className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingAnnouncement(announcement)}
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
        isOpen={!!deletingAnnouncement}
        variant="caution"
        title="Delete announcement?"
        description="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        busy={false}
        onConfirm={handleDelete}
        onCancel={() => setDeletingAnnouncement(null)}
      />
    </div>
  )
}

export default AdminAnnouncement
