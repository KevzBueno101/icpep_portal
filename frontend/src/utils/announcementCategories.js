export const CATEGORY_LABELS = {
  announcement: 'Announcement',
  achievement: 'Achievement',
  update: 'Update',
  opportunity: 'Opportunity',
  event: 'Event',
  deadline: 'Deadline',
}

export function formatCategory(category) {
  if (!category) return 'Announcement'
  const key = String(category).toLowerCase()
  return CATEGORY_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1)
}