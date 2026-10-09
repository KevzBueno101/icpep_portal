import { useState, useEffect } from 'react'
import { publicApi } from '../api/axios'

export default function FeaturedContent() {
  const [featuredItems, setFeaturedItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFeaturedContent = async () => {
      try {
        const res = await publicApi.get('/featured/')
        setFeaturedItems(res.data)
      } catch (err) {
        console.error('Failed to fetch featured content:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedContent()
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-slate-800/40 rounded-2xl animate-pulse" />
        ))}
      </div>
    )
  }

  if (featuredItems.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredItems.map((item) => (
        <div
          key={item.id}
          className="group rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:bg-slate-800/60 hover:shadow-[0_8px_30px_-4px_rgba(6,182,212,0.15)] hover:border-cyan-500/30"
        >
          {item.image && (
            <div className="aspect-video overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          )}
          <div className="p-6">
            <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
              {item.description}
            </p>
            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center mt-4 text-cyan-400 text-sm font-semibold hover:text-cyan-300 transition-colors"
              >
                Learn more
                <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
