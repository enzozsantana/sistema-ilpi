/** Redimensiona imagem para avatar (máx. 512px, JPEG ~0.85). */
export async function redimensionarAvatar(file: File, max = 512, qualidade = 0.85): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => no(new Error('Não foi possível ler a imagem.'))
      i.src = url
    })
    const scale = Math.min(1, max / Math.max(img.width, img.height))
    const w = Math.max(1, Math.round(img.width * scale))
    const h = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas indisponível.')
    ctx.drawImage(img, 0, 0, w, h)
    const blob = await new Promise<Blob>((ok, no) => {
      canvas.toBlob((b) => (b ? ok(b) : no(new Error('Falha ao compactar a imagem.'))), 'image/jpeg', qualidade)
    })
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
