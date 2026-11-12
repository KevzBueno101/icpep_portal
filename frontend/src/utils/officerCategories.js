// Landing leadership board categories. The backend stores a free-text
// `department` (exposed as `office`) and a free-text `position`, so category
// matching has to be tolerant of both.
export const OFFICER_CATEGORIES = [
  { key: 'head', label: 'Head Office' },
  { key: 'directors', label: 'Directors Office' },
  { key: 'representatives', label: 'Representatives' },
  { key: 'committees', label: 'Committees' },
]

const classifyText = (text) => {
  const value = String(text || '').toLowerCase()
  if (!value) return null
  if (value.includes('committee')) return 'committees'
  if (value.includes('representative') || value.includes('rep.')) return 'representatives'
  if (value.includes('director')) return 'directors'
  if (value.includes('head')) return 'head'
  return null
}

export const categoryForOfficer = (officer) => {
  // Prefer the office/department, then fall back to the position title. This
  // keeps older records (which may have an empty or unexpected department)
  // grouped sensibly instead of disappearing from the board.
  return (
    classifyText(officer?.office) ||
    classifyText(officer?.position) ||
    'head'
  )
}

export const categoryLabel = (key) =>
  OFFICER_CATEGORIES.find((category) => category.key === key)?.label || ''

export const groupOfficersByCategory = (officers = []) => {
  const groups = Object.fromEntries(
    OFFICER_CATEGORIES.map((category) => [category.key, []])
  )
  officers.forEach((officer) => {
    groups[categoryForOfficer(officer)].push(officer)
  })
  return groups
}