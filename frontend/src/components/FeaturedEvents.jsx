import { useState, useEffect } from 'react'
import { publicApi } from '../api/axios'

export default function FeaturedEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const res = await publicApi.get('/events/featured/')
        setEvents(res.data?.results || res.data || [])
      } catch (err) {
        console.error('Failed to fetch featured events:', err)
        setEvents([])
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedEvents()
  }, [])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'closed':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'full':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-96 bg-slate-800/40 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {events.map((event) => (
        <div
          key={event.id}
          className="group rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:bg-slate-800/60 hover:shadow-[0_8px_30px_-4px_rgba(6,182,212,0.15)] hover:border-cyan-500/30"
        >
          {/* Banner Image */}
          {event.banner_image && (
            <div className="aspect-video overflow-hidden">
              <img
                src={event.banner_image}
                alt={event.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}

          <div className="p-6">
            {/* Registration Status Badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(event.registration_status)}`}>
                {event.registration_status.charAt(0).toUpperCase() + event.registration_status.slice(1)}
              </span>
            </div>

            {/* Event Title */}
            <h3 className="text-2xl font-bold text-white mb-3">{event.title}</h3>

            {/* Date and Location */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-slate-400 text-sm">
                <span className="text-cyan-400 mr-2">📅</span>
                {formatDate(event.date)}
              </div>
              <div className="flex items-center text-slate-400 text-sm">
                <span className="text-cyan-400 mr-2">📍</span>
                {event.is_online ? 'Online' : event.location}
                {event.is_online && event.meeting_link && (
                  <a
                    href={event.meeting_link}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 text-cyan-400 hover:text-cyan-300 underline"
                  >
                    (Join Link)
                  </a>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3 mb-4">
              {event.description}
            </p>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {event.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Organizer */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/10">
              {event.organizer_logo && (
                <img
                  src={event.organizer_logo}
                  alt={event.organizer_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-xs text-slate-500">Event Organizer</p>
                <p className="text-sm font-semibold text-white">{event.organizer_name}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
