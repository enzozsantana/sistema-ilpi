import { useState, useEffect, useRef, useCallback } from 'react'

const DRAFT_PREFIX = 'senecurare_draft_'

export interface Rascunho<T = any> {
  chave: string
  dados: T
  salvoEm: string // ISO date
}

/**
 * Salva um rascunho de dados no localStorage com timestamp
 */
export function salvarRascunho<T>(chave: string, dados: T): void {
  if (typeof window === 'undefined' || !chave) return
  try {
    // Se dados for null, undefined ou string vazia, limpa o rascunho
    if (dados === null || dados === undefined || (typeof dados === 'string' && !dados.trim())) {
      limparRascunho(chave)
      return
    }

    const payload: Rascunho<T> = {
      chave,
      dados,
      salvoEm: new Date().toISOString(),
    }
    localStorage.setItem(`${DRAFT_PREFIX}${chave}`, JSON.stringify(payload))
  } catch (err) {
    console.warn(`[draftStorage] Erro ao salvar rascunho para '${chave}':`, err)
  }
}

/**
 * Recupera um rascunho salvo do localStorage
 */
export function obterRascunho<T>(chave: string): Rascunho<T> | null {
  if (typeof window === 'undefined' || !chave) return null
  try {
    const raw = localStorage.getItem(`${DRAFT_PREFIX}${chave}`)
    if (!raw) return null
    return JSON.parse(raw) as Rascunho<T>
  } catch (err) {
    console.warn(`[draftStorage] Erro ao ler rascunho para '${chave}':`, err)
    return null
  }
}

/**
 * Remove um rascunho específico do localStorage
 */
export function limparRascunho(chave: string): void {
  if (typeof window === 'undefined' || !chave) return
  try {
    localStorage.removeItem(`${DRAFT_PREFIX}${chave}`)
  } catch (err) {
    console.warn(`[draftStorage] Erro ao remover rascunho para '${chave}':`, err)
  }
}

/**
 * Verifica se existe um rascunho persistido para a chave
 */
export function temRascunho(chave: string): boolean {
  if (typeof window === 'undefined' || !chave) return false
  try {
    return localStorage.getItem(`${DRAFT_PREFIX}${chave}`) !== null
  } catch {
    return false
  }
}

/**
 * Lista todos os rascunhos salvos no localStorage (opcionalmente filtrados por prefixo de chave)
 */
export function listarRascunhos(filtroPrefixo?: string): Array<Rascunho<any>> {
  if (typeof window === 'undefined') return []
  const resultado: Array<Rascunho<any>> = []
  try {
    const total = localStorage.length
    for (let i = 0; i < total; i++) {
      const k = localStorage.key(i)
      if (k && k.startsWith(DRAFT_PREFIX)) {
        const chaveReal = k.slice(DRAFT_PREFIX.length)
        if (!filtroPrefixo || chaveReal.startsWith(filtroPrefixo)) {
          const r = obterRascunho(chaveReal)
          if (r) resultado.push(r)
        }
      }
    }
  } catch (err) {
    console.warn('[draftStorage] Erro ao listar rascunhos:', err)
  }
  return resultado
}

/**
 * Hook React para persistência e recuperação automática de rascunhos de formulários
 * - Inicializa o estado com o rascunho salvo (se houver)
 * - Salva automaticamente alterações no localStorage com debounce
 * - Fornece função para limpar após submissão bem-sucedida
 */
export function useFormDraft<T>(
  chave: string,
  valorInicial: T,
  opcoes?: {
    enabled?: boolean
    debounceMs?: number
    onRestored?: (dados: T, salvoEm: string) => void
  }
) {
  const enabled = opcoes?.enabled ?? true
  const debounceMs = opcoes?.debounceMs ?? 400

  // Inicializa o estado recuperando rascunho se existir
  const [valor, setValorInterno] = useState<T>(() => {
    if (!enabled || !chave) return valorInicial
    const r = obterRascunho<T>(chave)
    if (r && r.dados !== undefined && r.dados !== null) {
      return r.dados
    }
    return valorInicial
  })

  const [salvoEm, setSalvoEm] = useState<string | null>(() => {
    if (!enabled || !chave) return null
    const r = obterRascunho<T>(chave)
    return r ? r.salvoEm : null
  })

  const timerRef = useRef<any>(null)
  const primeiraCargaRef = useRef(true)

  // Quando a chave mudar, recarrega o rascunho correspondente
  useEffect(() => {
    if (!enabled || !chave) return
    const r = obterRascunho<T>(chave)
    if (r && r.dados !== undefined && r.dados !== null) {
      setValorInterno(r.dados)
      setSalvoEm(r.salvoEm)
      opcoes?.onRestored?.(r.dados, r.salvoEm)
    } else {
      setValorInterno(valorInicial)
      setSalvoEm(null)
    }
    primeiraCargaRef.current = false
  }, [chave, enabled])

  // Salva no localStorage com debounce ao alterar o valor
  const setValor = useCallback(
    (novoValorOuFn: T | ((prev: T) => T)) => {
      setValorInterno((prev) => {
        const proximo =
          typeof novoValorOuFn === 'function'
            ? (novoValorOuFn as (prev: T) => T)(prev)
            : novoValorOuFn

        if (enabled && chave) {
          if (timerRef.current) clearTimeout(timerRef.current)
          timerRef.current = setTimeout(() => {
            salvarRascunho(chave, proximo)
            setSalvoEm(new Date().toISOString())
          }, debounceMs)
        }

        return proximo
      })
    },
    [chave, enabled, debounceMs]
  )

  // Função para limpar o rascunho após salvar com sucesso
  const descartarRascunho = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    limparRascunho(chave)
    setSalvoEm(null)
  }, [chave])

  // Limpa timer ao desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return [
    valor,
    setValor,
    descartarRascunho,
    {
      salvoEm,
      temRascunho: Boolean(salvoEm),
    },
  ] as const
}
