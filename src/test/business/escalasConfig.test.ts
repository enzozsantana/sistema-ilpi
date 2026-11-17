import { describe, it, expect, beforeEach } from 'vitest'
import {
  carregarConfigEscalas,
  salvarConfigEscalas,
  DEFAULT_ESCALAS_CONFIG,
} from '../../lib/business/escalasConfig'
import type { ConfiguracaoEscalas, EscalaCustomizada } from '../../types/ilpi'

describe('escalasConfig (Persistência e Gerenciamento de Escalas da ILPI)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('retorna a configuração padrão se o localStorage estiver vazio', () => {
    const config = carregarConfigEscalas()
    expect(config.escalasAtivas).toEqual(DEFAULT_ESCALAS_CONFIG.escalasAtivas)
    expect(config.escalaDependenciaPadrao).toBe('fugulin')
    expect(config.escalasCustomizadas).toEqual([])
  })

  it('salva e recupera a configuração do localStorage', () => {
    const novaConfig: ConfiguracaoEscalas = {
      escalasAtivas: ['katz', 'lawton', 'morse'],
      escalaDependenciaPadrao: 'katz',
      escalasCustomizadas: [],
    }
    salvarConfigEscalas(novaConfig)

    const rec = carregarConfigEscalas()
    expect(rec.escalasAtivas).toEqual(['katz', 'lawton', 'morse'])
    expect(rec.escalaDependenciaPadrao).toBe('katz')
  })

  it('permite salvar e persistir escalas customizadas criadas pela equipe', () => {
    const custom: EscalaCustomizada = {
      id: 'custom_123',
      nome: 'Teste de Força Motora',
      desc: 'Educação Física',
      categoria: 'personalizada',
      area: 'Educação Física',
      itens: [
        ['Preensão manual', [['Forte', 2], ['Fraco', 0]]],
      ],
      faixas: [
        { min: 2, max: 2, txt: 'Força adequada', nivel: 'ok' },
        { min: 0, max: 1, txt: 'Fraqueza muscular', nivel: 'danger' },
      ],
      criadaEm: '2026-11-17',
    }

    const config: ConfiguracaoEscalas = {
      escalasAtivas: ['fugulin', 'custom_123'],
      escalaDependenciaPadrao: 'fugulin',
      escalasCustomizadas: [custom],
    }
    salvarConfigEscalas(config)

    const rec = carregarConfigEscalas()
    expect(rec.escalasCustomizadas).toHaveLength(1)
    expect(rec.escalasCustomizadas[0].nome).toBe('Teste de Força Motora')
    expect(rec.escalasAtivas).toContain('custom_123')
  })
})
