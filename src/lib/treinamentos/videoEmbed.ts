/**
 * Converte links do YouTube e Vimeo para links utilizáveis em iframe embed.
 */
export function toEmbedUrl(url: string): string {
  const trimmed = (url || '').trim()
  if (!trimmed) return ''

  // YouTube match
  const youtubeMatch = trimmed.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  )
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?rel=0&modestbranding=1`
  }

  // Vimeo match
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  if (trimmed.includes('/embed/')) {
    return trimmed
  }

  return trimmed
}
