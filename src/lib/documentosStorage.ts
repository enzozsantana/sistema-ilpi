import { supabase } from './supabase'

export interface AnexoDocumento {
  id: string
  tipoDocumento: 'alvara' | 'pop'
  nomeArquivo: string
  tipoMime: string
  tamanho: number
  dataUpload: string
  url: string // Data URL base64 ou URL pública
}

const DB_NAME = 'ilpi_anexos_db'
const STORE_NAME = 'documentos'
const DB_VERSION = 1

function obterDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'chave' })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

function gerarChave(tipo: 'alvara' | 'pop', id: string): string {
  return `${tipo}:${id}`
}

/** Salva anexo em IndexedDB com fallback para LocalStorage (metadados) */
export async function salvarAnexoLocal(anexo: AnexoDocumento): Promise<void> {
  const chave = gerarChave(anexo.tipoDocumento, anexo.id)

  // 1. Tentar salvar no IndexedDB (sem limite de 5MB do localStorage)
  const db = await obterDB()
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        store.put({ chave, ...anexo })
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  // 2. Salvar metadados no localStorage para indexação rápida
  try {
    const metaChave = `ilpi_meta_${chave}`
    const meta = {
      id: anexo.id,
      tipoDocumento: anexo.tipoDocumento,
      nomeArquivo: anexo.nomeArquivo,
      tipoMime: anexo.tipoMime,
      tamanho: anexo.tamanho,
      dataUpload: anexo.dataUpload,
      // Se a URL for curta (ex: link do Supabase), armazena no localStorage
      url: anexo.url.length < 500 ? anexo.url : '',
    }
    localStorage.setItem(metaChave, JSON.stringify(meta))
  } catch {
    // localStorage cheio ou indisponível
  }
}

/** Obtém anexo pelo ID do documento ou POP */
export async function obterAnexoLocal(tipo: 'alvara' | 'pop', id: string): Promise<AnexoDocumento | null> {
  const chave = gerarChave(tipo, id)

  // 1. Tenta buscar no IndexedDB
  const db = await obterDB()
  if (db) {
    const res = await new Promise<AnexoDocumento | null>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.get(chave)
        req.onsuccess = () => {
          if (req.result) {
            const { chave: _c, ...resto } = req.result
            resolve(resto as AnexoDocumento)
          } else {
            resolve(null)
          }
        }
        req.onerror = () => resolve(null)
      } catch {
        resolve(null)
      }
    })
    if (res) return res
  }

  // 2. Fallback para localStorage
  try {
    const raw = localStorage.getItem(`ilpi_meta_${chave}`)
    if (raw) {
      return JSON.parse(raw) as AnexoDocumento
    }
  } catch {
    // ignorar
  }

  return null
}

/** Remove anexo */
export async function removerAnexoLocal(tipo: 'alvara' | 'pop', id: string): Promise<void> {
  const chave = gerarChave(tipo, id)

  const db = await obterDB()
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite')
        const store = tx.objectStore(STORE_NAME)
        store.delete(chave)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  try {
    localStorage.removeItem(`ilpi_meta_${chave}`)
  } catch {
    // ignorar
  }
}

/** Carrega todos os anexos de um determinado tipo */
export async function carregarTodosAnexosLocais(tipo: 'alvara' | 'pop'): Promise<Record<string, AnexoDocumento>> {
  const mapa: Record<string, AnexoDocumento> = {}

  // 1. Tentar ler do IndexedDB
  const db = await obterDB()
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly')
        const store = tx.objectStore(STORE_NAME)
        const req = store.getAll()
        req.onsuccess = () => {
          if (req.result && Array.isArray(req.result)) {
            for (const item of req.result) {
              if (item.tipoDocumento === tipo && item.id) {
                const { chave: _c, ...resto } = item
                mapa[item.id] = resto as AnexoDocumento
              }
            }
          }
          resolve()
        }
        req.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  // 2. Mesclar metadados do localStorage (caso falte algum item)
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const prefix = `ilpi_meta_${tipo}:`
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(prefix)) {
          const raw = localStorage.getItem(key)
          if (raw) {
            const anexo = JSON.parse(raw) as AnexoDocumento
            if (anexo.id && !mapa[anexo.id]) {
              mapa[anexo.id] = anexo
            }
          }
        }
      }
    } catch {
      // ignorar
    }
  }

  return mapa
}

/** Lê um arquivo do usuário e gera o AnexoDocumento */
export async function processarArquivoParaAnexo(
  tipo: 'alvara' | 'pop',
  id: string,
  file: File
): Promise<AnexoDocumento> {
  // Ler conteúdo como base64 Data URL
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Erro ao ler arquivo.'))
    reader.readAsDataURL(file)
  })

  let urlFinal = dataUrl

  // Tenta upload para Supabase Storage se for imagem ou PDF
  try {
    const ext = file.name.split('.').pop() || 'bin'
    const path = `${tipo}s/${id}_${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('profissionais').upload(path, file, {
      upsert: true,
      contentType: file.type || 'application/octet-stream',
    })
    if (!error && data?.path) {
      const { data: pubData } = supabase.storage.from('profissionais').getPublicUrl(data.path)
      if (pubData?.publicUrl) {
        urlFinal = pubData.publicUrl
      }
    }
  } catch {
    // Fallback para dataUrl sem interromper o usuário
  }

  const anexo: AnexoDocumento = {
    id,
    tipoDocumento: tipo,
    nomeArquivo: file.name,
    tipoMime: file.type || 'application/pdf',
    tamanho: file.size,
    dataUpload: new Date().toISOString(),
    url: urlFinal,
  }

  // Salvar no storage local
  await salvarAnexoLocal(anexo)

  return anexo
}

/** Formata bytes para exibição legível (ex: 1.2 MB, 450 KB) */
export function formatarTamanhoArquivo(bytes?: number): string {
  if (!bytes || bytes <= 0) return 'Tamanho desconhecido'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Abre o documento em uma nova aba ou faz download */
export function abrirDocumento(anexo: AnexoDocumento): void {
  if (!anexo.url) return

  // Se for URL externa segura ou Data URL
  if (anexo.url.startsWith('http://') || anexo.url.startsWith('https://')) {
    window.open(anexo.url, '_blank', 'noopener,noreferrer')
    return
  }

  // Se for base64 Data URL
  if (anexo.url.startsWith('data:')) {
    // Para PDF ou imagem, podemos abrir em nova janela ou disparar download
    const win = window.open('', '_blank')
    if (win) {
      if (anexo.tipoMime.startsWith('image/')) {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>${anexo.nomeArquivo}</title></head>
            <body style="margin:0; background:#0f172a; display:flex; justify-content:center; align-items:center; min-height:100vh;">
              <img src="${anexo.url}" style="max-width:98%; max-height:98vh; object-fit:contain; border-radius:8px; box-shadow:0 8px 30px rgba(0,0,0,0.5);" alt="${anexo.nomeArquivo}" />
            </body>
          </html>
        `)
        win.document.close()
        return
      }

      if (anexo.tipoMime === 'application/pdf') {
        win.document.write(`
          <!DOCTYPE html>
          <html>
            <head><title>${anexo.nomeArquivo}</title></head>
            <body style="margin:0; height:100vh;">
              <iframe src="${anexo.url}" style="width:100%; height:100%; border:none;"></iframe>
            </body>
          </html>
        `)
        win.document.close()
        return
      }
    }

    // Fallback: download direto
    baixarDocumento(anexo)
  }
}

/** Força download do documento com nome de arquivo original */
export function baixarDocumento(anexo: AnexoDocumento): void {
  const link = document.createElement('a')
  link.href = anexo.url
  link.download = anexo.nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
