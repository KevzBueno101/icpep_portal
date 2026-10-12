export const CATEGORY_LABELS = {
  announcement: 'Announcement',
  achievement: 'Achievement',
  update: 'Update',
  opportunity: 'Opportunity',
  event: 'Event',
  deadline: 'Deadline',
  news: 'News',
  opinion: 'Opinion',
}

export function formatCategory(category) {
  if (!category) return 'Announcement'
  const key = String(category).toLowerCase()
  return CATEGORY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1)
}

export function getNewestAnnouncementId(announcements) {
  if (!Array.isArray(announcements) || announcements.length === 0) return null
  return announcements.reduce((newest, current) => {
    if (!newest) return current
    return new Date(current?.created_at || 0) > new Date(newest?.created_at || 0)
      ? current
      : newest
  }, null)?.id ?? null
}