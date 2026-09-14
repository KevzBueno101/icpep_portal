import api, { publicApi } from '../api/axios'

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

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

export async function getRegistration() {
  // If the service worker hasn't been registered yet, register it and wait
  // until it is active. Early clicks on "Enable Notifications" otherwise fail
  // with "Service worker is not ready yet."
  if (!navigator.serviceWorker.controller && !(await navigator.serviceWorker.getRegistration())) {
    try {
      await navigator.serviceWorker.register('/sw.js')
    } catch {
      // Registration failed; fall through — getRegistration() below reports null.
    }
  }
  try {
    return await withTimeout(navigator.serviceWorker.ready, 10000)
  } catch {
    return navigator.serviceWorker.getRegistration()
  }
}

export async function getVapidPublicKey() {
  // Retry a few times — a flaky network (or a possibly stale SW-backed
  // request) can otherwise surface as a push "registration failed" error.
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await publicApi.get('/push/vapid-key/')
      const key = res.data.public_key
      if (key) return key
    } catch (err) {
      lastError = err
      if (err?.response?.status === 503) throw err
    }
    await new Promise((resolve) => setTimeout(resolve, 800))
  }
  throw lastError || new Error('Could not load the push key from the server.')
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

  const { data } = await api.post(SUBSCRIBE_URL, subscription.toJSON())
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
      await api.post(UNSUBSCRIBE_URL, { endpoint })
    } catch {
      // Server may be unreachable; the local unsubscribe still takes effect.
    }
  }
}
