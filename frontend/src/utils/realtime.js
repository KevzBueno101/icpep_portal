export const RESOURCES = {
  ANNOUNCEMENTS: 'announcements',
  ABOUT: 'about',
  MILESTONES: 'milestones',
  OFFICERS: 'officers',
  ADMINS: 'admins',
  MEMBERS: 'members',
  PAYMENT_SETTINGS: 'payment-settings',
}

export const ALL_RESOURCES = Object.values(RESOURCES)

export const RESOURCE_LABELS = {
  [RESOURCES.ANNOUNCEMENTS]: 'Announcements were updated',
  [RESOURCES.ABOUT]: 'About content was updated',
  [RESOURCES.MILESTONES]: 'Milestones were updated',
  [RESOURCES.OFFICERS]: 'Officers roster was updated',
  [RESOURCES.ADMINS]: 'Admin accounts were updated',
  [RESOURCES.MEMBERS]: 'Member records were updated',
  [RESOURCES.PAYMENT_SETTINGS]: 'Payment settings were updated',
}

export const CONTENT_UPDATED_EVENT = 'realtime:content-updated'

export function labelForResources(resources = []) {
  const first = resources.find((r) => RESOURCE_LABELS[r])
  return first ? RESOURCE_LABELS[first] : 'New updates are available'
}
