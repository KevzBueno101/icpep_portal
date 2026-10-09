import { useState, useEffect } from 'react'
import api from '../../api/axios'

export default function AdminFeaturedContent() {
  const [featuredItems, setFeaturedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link: '',
    display_order: 0,
    is_active: true,
  })
  const [imageFile, setImageFile] = useState(null)

  useEffect(() => {
    fetchFeaturedContent()
  }, [])

  const fetchFeaturedContent = async () => {
    try {
      const res = await api.get('/featured/')
      setFeaturedItems(res.data)
    } catch (err) {
      console.error('Failed to fetch featured content:', err)
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
    if (imageFile) {
      formDataToSend.append('image', imageFile)
    }

    try {
      if (editingItem) {
        await api.put(`/featured/${editingItem.id}/`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      } else {
        await api.post('/featured/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }
      fetchFeaturedContent()
      setShowForm(false)
      setEditingItem(null)
      setFormData({ title: '', description: '', link: '', display_order: 0, is_active: true })
      setImageFile(null)
    } catch (err) {
      console.error('Failed to save featured content:', err)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      link: item.link || '',
      display_order: item.display_order,
      is_active: item.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this featured content?')) return
    try {
      await api.delete(`/featured/${id}/`)
      fetchFeaturedContent()
    } catch (err) {
      console.error('Failed to delete featured content:', err)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Featured Content</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
        >
          Add Featured Content
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-slate-800 rounded-lg">
          <h2 className="text-xl font-bold mb-4">
            {editingItem ? 'Edit Featured Content' : 'Add Featured Content'}
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
                rows={4}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Link (optional)</label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Image</label>
              <input
                type="file"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                accept="image/*"
              />
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Active</label>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
              >
                {editingItem ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingItem(null)
                  setFormData({ title: '', description: '', link: '', display_order: 0, is_active: true })
                  setImageFile(null)
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
        {featuredItems.map((item) => (
          <div key={item.id} className="p-4 bg-slate-800 rounded-lg flex items-center gap-4">
            {item.image && (
              <img src={item.image} alt={item.title} className="w-20 h-20 object-cover rounded" />
            )}
            <div className="flex-1">
              <h3 className="font-bold">{item.title}</h3>
              <p className="text-sm text-slate-400 line-clamp-2">{item.description}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs px-2 py-1 rounded bg-slate-700">
                  Order: {item.display_order}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${item.is_active ? 'bg-green-700' : 'bg-red-700'}`}>
                  {item.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(item)}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
