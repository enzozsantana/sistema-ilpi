import { supabase } from './supabase'

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

/** Compacta foto de evidência clínica/cuidado (máx. 1280px, JPEG ~0.82) e retorna base64 Data URL */
export async function compactarFotoParaDataUrl(file: File, max = 1280, qualidade = 0.82): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((ok, no) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = () => no(new Error('Não foi possível processar a foto tirada.'))
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
    return canvas.toDataURL('image/jpeg', qualidade)
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Tenta upload para o Supabase Storage com fallback automático para Data URL compactada */
export async function processarEUploadFoto(file: File, prefix = 'evidencias'): Promise<string> {
  const dataUrl = await compactarFotoParaDataUrl(file)
  try {
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const path = `${prefix}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`
    const { data, error } = await supabase.storage.from('profissionais').upload(path, blob, {
      upsert: true,
      contentType: 'image/jpeg',
    })
    if (!error && data?.path) {
      const { data: pubData } = supabase.storage.from('profissionais').getPublicUrl(data.path)
      if (pubData?.publicUrl) return pubData.publicUrl
    }
  } catch {
    // Fallback silencioso e seguro para a data URL base64 já compactada
  }
  return dataUrl
}
