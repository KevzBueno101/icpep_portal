let deferredPrompt = null
let listeners = []

export function setInstallPrompt(prompt) {
  deferredPrompt = prompt
  emit()
}

export function clearInstallPrompt() {
  deferredPrompt = null
  emit()
}

export function getInstallPrompt() {
  return deferredPrompt
}

function emit() {
  listeners.forEach((listener) => listener(deferredPrompt))
}

export function subscribeInstallPrompt(listener) {
  listeners.push(listener)
  return () => {
    listeners = listeners.filter((l) => l !== listener)
  }
}
