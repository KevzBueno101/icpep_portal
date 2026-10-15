import api from './axios'

export async function fetchCertificateBlob(id) {
  const res = await api.get(`/certificates/${id}/download/`, { responseType: 'blob' })
  return res.data
}

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

export async function downloadCertificate(certificate, filename) {
  const blob = await fetchCertificateBlob(certificate.id)
  const name =
    filename ||
    `Certificate_${(certificate.event_name || 'event').replace(/[^a-z0-9]+/gi, '_')}_${certificate.verification_code}.pdf`
  saveBlob(blob, name)
}

export async function viewCertificate(certificate) {
  const blob = await fetchCertificateBlob(certificate.id)
  const url = window.URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
  setTimeout(() => window.URL.revokeObjectURL(url), 60000)
}

export function certificateVerifyUrl(code) {
  const origin =
    import.meta.env.VITE_FRONTEND_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  return `${origin}/verify/${code}`
}

export async function fetchCandidateIds({ search = '', eventName = '', eventDate = '' } = {}) {
  const res = await api.get('/certificates/candidates/ids/', {
    params: {
      ...(search ? { search } : {}),
      ...(eventName ? { event_name: eventName } : {}),
      ...(eventDate ? { event_date: eventDate } : {}),
    },
  })
  return res.data
}
