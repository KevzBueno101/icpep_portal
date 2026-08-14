export const downloadFile = async (url, filename) => {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(objectUrl)
  } catch (err) {
    console.error('Download failed:', err)
  }
}
