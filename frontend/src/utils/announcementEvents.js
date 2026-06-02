export const ANNOUNCEMENT_UPDATED_EVENT = 'announcementUpdated'
export const ANNOUNCEMENT_DELETED_EVENT = 'announcementDeleted'

export function notifyAnnouncementUpdated(announcementId) {
  window.dispatchEvent(
    new CustomEvent(ANNOUNCEMENT_UPDATED_EVENT, { detail: { id: announcementId } })
  )
}

export function notifyAnnouncementDeleted(announcementId) {
  window.dispatchEvent(
    new CustomEvent(ANNOUNCEMENT_DELETED_EVENT, { detail: { id: announcementId } })
  )
}
