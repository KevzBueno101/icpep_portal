export default function AnnouncementCard({ announcement }) {
  const { title, body, category, created_at, author, pinned } = announcement

  const categoryColors = {
    announcement: 'bg-sky-100 text-sky-700',
    achievement: 'bg-green-100 text-green-700',
    update: 'bg-blue-100 text-blue-700',
    opportunity: 'bg-amber-100 text-amber-800',
    event: 'bg-purple-100 text-purple-700',
  }

  const categoryColor = categoryColors[category] || categoryColors.announcement

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {pinned && (
        <div className="bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-800">
          Pinned
        </div>
      )}
      <div className="p-6">
        <div className="mb-3 flex items-start justify-between">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${categoryColor}`}>
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </span>
        </div>

        <h3 className="mb-2 text-lg font-bold text-slate-900">{title}</h3>
        <p className="mb-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{body}</p>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{author || 'Admin'}</span>
          <span>
            {created_at
              ? new Date(created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Just now'}
          </span>
        </div>
      </div>
    </article>
  )
}
