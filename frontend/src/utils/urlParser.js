export function parseUrlsInText(text) {
  if (!text) return text

  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-sky-600 hover:text-sky-700 underline font-medium">${url}</a>`
  })
}
