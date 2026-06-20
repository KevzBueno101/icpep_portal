const BACKEND_BASES = [
  // Reads from Vite env, fallback to local dev
  import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000',
]

export const resolveProfilePictureUrl = (profilePicture) => {
  if (!profilePicture) return null

  // If backend already returns absolute URL (Cloudinary URLs or full URLs)
  if (typeof profilePicture === 'string' && (profilePicture.startsWith('http://') || profilePicture.startsWith('https://'))) {
    return profilePicture
  }

  // Relative path like /media/... (local storage)
  if (typeof profilePicture === 'string' && profilePicture.startsWith('/')) {
    // Use backend origin explicitly if possible; otherwise fall back to current origin.
    // This avoids breaking when frontend runs on a different host/port.
    const currentOrigin = window.location.origin

    // Known base (matches axios baseURL)
    const backendBase = BACKEND_BASES[0]

    // If frontend and backend are same-origin, relative-to-current-origin works.
    if (currentOrigin && currentOrigin !== 'null' && currentOrigin === backendBase) {
      return `${currentOrigin}${profilePicture}`
    }

    return `${backendBase}${profilePicture}`
  }

  // Fallback: just return as-is (for Cloudinary public_ids or other formats)
  return profilePicture
}


