import { useState, useEffect, useCallback } from 'react'
import type { ConfiguracaoEscalas, EscalaCustomizada } from '../../types/ilpi'
import { SCALES } from './escalas'
import { supabase } from '../supabase'

export const STORAGE_KEY_ESCALAS = 'ilpi_configuracao_escalas'
export const EVENT_ESCALAS_CHANGE = 'ilpi_escalas_config_changed'

export const DEFAULT_ESCALAS_CONFIG: ConfiguracaoEscalas = {
  // Por padrão, Fugulin e as demais escalas clínicas estão ativas;
  // Katz e Lawton podem ser ativadas no padrão São Paulo/Coren-SP ou conforme rotina da ILPI
  escalasAtivas: [
    'fugulin',
    'morse',
    'braden',
    'glasgow',
    'mna',
    'gds15',
    'meem',
    'cdr',
    'ohat',
  ],
  escalaDependenciaPadrao: 'fugulin',
  escalasCustomizadas: [],
}

export function carregarConfigEscalas(): ConfiguracaoEscalas {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ESCALAS)
    if (!raw) return DEFAULT_ESCALAS_CONFIG
    const parsed = JSON.parse(raw) as Partial<ConfiguracaoEscalas>
    return {
      escalasAtivas: Array.isArray(parsed.escalasAtivas) && parsed.escalasAtivas.length > 0
        ? parsed.escalasAtivas
        : DEFAULT_ESCALAS_CONFIG.escalasAtivas,
      escalaDependenciaPadrao: parsed.escalaDependenciaPadrao === 'katz' ? 'katz' : 'fugulin',
      escalasCustomizadas: Array.isArray(parsed.escalasCustomizadas)
        ? parsed.escalasCustomizadas
        : [],
    }
  } catch {
    return DEFAULT_ESCALAS_CONFIG
  }
}

export function salvarConfigEscalas(novaConfig: ConfiguracaoEscalas, syncSupabase: boolean = true): void {
  try {
    localStorage.setItem(STORAGE_KEY_ESCALAS, JSON.stringify(novaConfig))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_ESCALAS_CHANGE, { detail: novaConfig }))
    }

    if (syncSupabase) {
      void supabase
        .from('instituicao')
        .update({ escalas_config: novaConfig })
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .then(({ error }) => {
          if (error) {
            console.warn('Aviso: para persistir no Supabase, execute a migration SQL em seu painel:', error.message)
          }
        })
    }
  } catch (err) {
    console.error('Erro ao salvar configuração de escalas:', err)
  }
}

export function useEscalasConfig() {
  const [config, setConfig] = useState<ConfiguracaoEscalas>(carregarConfigEscalas)

  useEffect(() => {
    function handleUpdate(e: Event) {
      const customEvt = e as CustomEvent<ConfiguracaoEscalas>
      if (customEvt.detail) {
        setConfig(customEvt.detail)
      } else {
        setConfig(carregarConfigEscalas())
      }
    }

    window.addEventListener(EVENT_ESCALAS_CHANGE, handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener(EVENT_ESCALAS_CHANGE, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const toggleEscala = useCallback((key: string, ativa: boolean) => {
    setConfig((prev) => {
      let novasAtivas = [...prev.escalasAtivas]
      if (ativa && !novasAtivas.includes(key)) {
        novasAtivas.push(key)
      } else if (!ativa) {
        novasAtivas = novasAtivas.filter((k) => k !== key)
      }
      const nextConfig = { ...prev, escalasAtivas: novasAtivas }
      salvarConfigEscalas(nextConfig)
      return nextConfig
    })
  }, [])

  const setDependenciaPadrao = useCallback((padrao: 'fugulin' | 'katz') => {
    setConfig((prev) => {
      // Se definiu Katz, garante que Katz está ativa
      let ativas = [...prev.escalasAtivas]
      if (padrao === 'katz' && !ativas.includes('katz')) {
        ativas.push('katz')
      }
      if (padrao === 'fugulin' && !ativas.includes('fugulin')) {
        ativas.push('fugulin')
      }
      const nextConfig = {
        ...prev,
        escalaDependenciaPadrao: padrao,
        escalasAtivas: ativas,
      }
      salvarConfigEscalas(nextConfig)
      return nextConfig
    })
  }, [])

  const aplicarPreset = useCallback((preset: 'padrao_nacional' | 'sao_paulo' | 'todas') => {
    setConfig((prev) => {
      let ativas: string[] = []
      let dep: 'fugulin' | 'katz' = 'fugulin'

      if (preset === 'padrao_nacional') {
        // Usa Fugulin, desativa Katz e Lawton
        dep = 'fugulin'
        ativas = ['fugulin', 'morse', 'braden', 'glasgow', 'mna', 'gds15', 'meem', 'cdr', 'ohat']
      } else if (preset === 'sao_paulo') {
        // Usa Katz e Lawton (AGA), desativa Fugulin
        dep = 'katz'
        ativas = ['katz', 'lawton', 'morse', 'braden', 'glasgow', 'mna', 'gds15', 'meem', 'cdr', 'ohat']
      } else {
        // Todas ativas
        dep = prev.escalaDependenciaPadrao
        ativas = [
          ...Object.keys(SCALES),
          ...prev.escalasCustomizadas.map((c) => c.id),
        ]
      }

      // Mantém escalas customizadas ativas se já estavam
      const customAtivas = prev.escalasAtivas.filter((k) =>
        prev.escalasCustomizadas.some((c) => c.id === k)
      )
      const nextAtivas = Array.from(new Set([...ativas, ...customAtivas]))

      const nextConfig = {
        ...prev,
        escalaDependenciaPadrao: dep,
        escalasAtivas: nextAtivas,
      }
      salvarConfigEscalas(nextConfig)
      return nextConfig
    })
  }, [])

  const adicionarOuEditarCustomizada = useCallback((escala: EscalaCustomizada) => {
    setConfig((prev) => {
      const idx = prev.escalasCustomizadas.findIndex((c) => c.id === escala.id)
      let custom: EscalaCustomizada[]
      if (idx >= 0) {
        custom = [...prev.escalasCustomizadas]
        custom[idx] = escala
      } else {
        custom = [...prev.escalasCustomizadas, escala]
      }
      // Ao criar/editar, garante que fica ativa
      const ativas = prev.escalasAtivas.includes(escala.id)
        ? prev.escalasAtivas
        : [...prev.escalasAtivas, escala.id]

      const nextConfig = {
        ...prev,
        escalasCustomizadas: custom,
        escalasAtivas: ativas,
      }
      salvarConfigEscalas(nextConfig)
      return nextConfig
    })
  }, [])

  const excluirCustomizada = useCallback((id: string) => {
    setConfig((prev) => {
      const nextConfig = {
        ...prev,
        escalasCustomizadas: prev.escalasCustomizadas.filter((c) => c.id !== id),
        escalasAtivas: prev.escalasAtivas.filter((k) => k !== id),
      }
      salvarConfigEscalas(nextConfig)
      return nextConfig
    })
  }, [])

  return {
    config,
    toggleEscala,
    setDependenciaPadrao,
    aplicarPreset,
    adicionarOuEditarCustomizada,
    excluirCustomizada,
  }
}
