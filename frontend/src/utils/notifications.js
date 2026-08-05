import { publicApi } from '../api/axios'

const SUBSCRIBE_URL = '/push/subscribe/'
const UNSUBSCRIBE_URL = '/push/unsubscribe/'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function isPushSupported() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export async function getRegistration() {
  return navigator.serviceWorker.getRegistration()
}

export async function getVapidPublicKey() {
  const res = await publicApi.get('/push/vapid-key/')
  return res.data.public_key
}

export async function getSubscriptionStatus() {
  const registration = await getRegistration()
  if (!registration) return null
  const subscription = await registration.pushManager.getSubscription()
  return subscription
}

/**
 * Enables push notifications for the current device.
 * Must be called from a user gesture (Notification.requestPermission).
 * Returns the new subscription, or null if the user declined.
 */
export async function enableNotifications() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this device.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const registration = await getRegistration()
  if (!registration) {
    throw new Error('Service worker is not ready yet. Please try again.')
  }

  const vapidKey = await getVapidPublicKey()
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  })

  const { data } = await publicApi.post(SUBSCRIBE_URL, subscription.toJSON())
  return data
}

/**
 * Disables push notifications and removes the subscription from the server.
 */
export async function disableNotifications() {
  const registration = await getRegistration()
  if (!registration) return

  const subscription = await registration.pushManager.getSubscription()
  if (subscription) {
    const endpoint = subscription.endpoint
    await subscription.unsubscribe()
    try {
      await publicApi.post(UNSUBSCRIBE_URL, { endpoint })
    } catch {
      // Server may be unreachable; the local unsubscribe still takes effect.
    }
  }
}
