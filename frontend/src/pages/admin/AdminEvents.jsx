import { useState, useEffect } from 'react'
import { api } from '../../api/axios'

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    date: '',
    location: '',
    is_online: false,
    meeting_link: '',
    organizer_name: '',
    tags: '',
    registration_status: 'open',
    is_featured: false,
    display_order: 0,
  })
  const [bannerImage, setBannerImage] = useState(null)
  const [organizerLogo, setOrganizerLogo] = useState(null)
  const [galleryImages, setGalleryImages] = useState([])

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const res = await api.get('/events/')
      setEvents(res.data)
    } catch (err) {
      console.error('Failed to fetch events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const formDataToSend = new FormData()
    Object.keys(formData).forEach(key => {
      formDataToSend.append(key, formData[key])
    })
    if (bannerImage) {
      formDataToSend.append('banner_image', bannerImage)
    }
    if (organizerLogo) {
      formDataToSend.append('organizer_logo', organizerLogo)
    }
    galleryImages.forEach((img, idx) => {
      formDataToSend.append('gallery_images', img)
    })
    // Handle tags as JSON array
    const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t)
    formDataToSend.set('tags', JSON.stringify(tagsArray))

    try {
      if (editingEvent) {
        await api.put(`/events/${editingEvent.id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await api.post('/events/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      fetchEvents()
      setShowForm(false)
      setEditingEvent(null)
      resetForm()
    } catch (err) {
      console.error('Failed to save event:', err)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content: '',
      date: '',
      location: '',
      is_online: false,
      meeting_link: '',
      organizer_name: '',
      tags: '',
      registration_status: 'open',
      is_featured: false,
      display_order: 0,
    })
    setBannerImage(null)
    setOrganizerLogo(null)
    setGalleryImages([])
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      content: event.content,
      date: event.date,
      location: event.location,
      is_online: event.is_online,
      meeting_link: event.meeting_link || '',
      organizer_name: event.organizer_name,
      tags: Array.isArray(event.tags) ? event.tags.join(', ') : '',
      registration_status: event.registration_status,
      is_featured: event.is_featured,
      display_order: event.display_order,
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return
    try {
      await api.delete(`/events/${id}/`)
      fetchEvents()
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
        >
          Add Event
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-slate-800 rounded-lg max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">
            {editingEvent ? 'Edit Event' : 'Add Event'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                rows={3}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                rows={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="datetime-local"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_online}
                  onChange={(e) => setFormData({ ...formData, is_online: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Online Event</span>
              </label>
            </div>
            {formData.is_online && (
              <div>
                <label className="block text-sm font-medium mb-1">Meeting Link</label>
                <input
                  type="url"
                  value={formData.meeting_link}
                  onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">Organizer Name</label>
              <input
                type="text"
                value={formData.organizer_name}
                onChange={(e) => setFormData({ ...formData, organizer_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Workshop, Webinar, AI"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Registration Status</label>
              <select
                value={formData.registration_status}
                onChange={(e) => setFormData({ ...formData, registration_status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="full">Full</option>
              </select>
            </div>
            <div className="flex gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Display Order</label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Featured</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Banner Image</label>
              <input
                type="file"
                onChange={(e) => setBannerImage(e.target.files[0])}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                accept="image/*"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Organizer Logo</label>
              <input
                type="file"
                onChange={(e) => setOrganizerLogo(e.target.files[0])}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                accept="image/*"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gallery Images</label>
              <input
                type="file"
                onChange={(e) => setGalleryImages(Array.from(e.target.files))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                accept="image/*"
                multiple
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                {editingEvent ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingEvent(null)
                  resetForm()
                }}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {events.map((event) => (
          <div key={event.id} className="p-4 bg-slate-800 rounded-lg">
            <div className="flex items-start gap-4">
              {event.banner_image && (
                <img src={event.banner_image} alt={event.title} className="w-32 h-20 object-cover rounded" />
              )}
              <div className="flex-1">
                <h3 className="font-bold">{event.title}</h3>
                <p className="text-sm text-slate-400 line-clamp-2">{event.description}</p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded bg-slate-700">
                    {new Date(event.date).toLocaleDateString()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${event.is_featured ? 'bg-cyan-700' : 'bg-slate-700'}`}>
                    {event.is_featured ? 'Featured' : 'Regular'}
                  </span>
                  <span className="text-xs px-2 py-1 rounded bg-slate-700">
                    {event.registration_status}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(event)}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(event.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
