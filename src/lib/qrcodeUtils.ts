/**
 * Utilitário resiliente para geração de QR Codes
 * Compatível tanto com bundling de produção quanto desenvolvimento Vite (HMR)
 */
export async function gerarQrCodeDataUrl(texto: string, largura = 280): Promise<string> {
  if (!texto || !texto.trim()) return ''

  try {
    const qrcodeModule = await import('qrcode')
    const toDataURL =
      (qrcodeModule as any).default?.toDataURL || (qrcodeModule as any).toDataURL
    if (typeof toDataURL === 'function') {
      return await toDataURL(texto, {
        width: largura,
        margin: 1,
        color: { dark: '#091519', light: '#ffffff' },
      })
    }
  } catch (err) {
    console.warn('Carregamento dinâmico do qrcode falhou, usando fallback direto:', err)
  }

  // Fallback seguro usando API de QR code pública caso haja erro de dependência do Vite no dev server
  return `https://api.qrserver.com/v1/create-qr-code/?size=${largura}x${largura}&margin=4&data=${encodeURIComponent(
    texto
  )}`
}
